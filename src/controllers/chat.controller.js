const ChatModel = require("../models/chat.model.js");

const asyncHandler = require("express-async-handler");
const MessageModel = require("../models/message.model.js");

const { deleteFile } = require("../utils/aws.utlis.js");

exports.createOrRetrieveChat = asyncHandler(async (req, res) => {
  const receiverUserId = req.body?.userId;
  const loggedInUserId = req.body.user._id;

  if (!receiverUserId) {
    res.status(400);
    throw new Error("UserId not sent in request body");
  }

  // First check if a chat exists with the above users
  const existingChats = await ChatModel.find({
    $and: [
      { isGroupChat: false },
      { users: { $elemMatch: { $eq: receiverUserId } } },
      { users: { $elemMatch: { $eq: loggedInUserId } } },
    ],
  })
    .populate("users", "-password -notifications")
    .populate({
      path: "lastMessage",
      model: "Message",
      populate: {
        path: "sender",
        model: "User",
        select: "email",
      },
    });

  if (existingChats.length > 0) {
    res.status(200).json(existingChats[0]);
  } else {
    // If it doesn't exist, then create a new chat
    const createdChat = await ChatModel.create({
      chatName: "reciever",
      isGroupChat: false,
      users: [receiverUserId, loggedInUserId],
    });

    const populatedChat = await ChatModel.findById(createdChat._id).populate({
      path: "users",
      model: "User",
      select: "-notifications",
    });
    res.status(201).json(populatedChat);
  }
});

exports.fetchChats = asyncHandler(async (req, res) => {
    console.log("835302--> ",)
  const loggedInUserId = req.body.user._id;

  // Fetch all the chats for the currently logged-in user
  const chats = await ChatModel.find({
    users: { $elemMatch: { $eq: loggedInUserId } },
  })
    .populate("users", "-password -notifications")
    .populate("groupAdmins", "-password -notifications")
    .populate({
      path: "lastMessage",
      model: "Message",
      // Nested populate in mongoose
      populate: {
        path: "sender",
        model: "User",
        select: "name email profilePic",
      },
    })
    .sort({ updatedAt: "desc" }); // (latest to oldest)

  res.status(200).json(chats);
});

exports.fetchMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    res.status(400);
    throw new Error("Invalid chatId for fetching messages");
  }
  const messages = await MessageModel.find({ chat: chatId })
    .populate({
      path: "sender",
      model: "User",
      select: "-notifications",
    })
    .sort({ createdAt: "desc" });
  // Latest to oldest here, but oldest to latest in frontend
  // as it's 'd-flex flex-column-reverse' for msg list
  res.status(200).json(messages);
});

exports.sendMessage = asyncHandler(async (req, res) => {
    console.log("sendMessage-->");
  const attachment = req?.file;
  const { content, chatId } = req.body;
  const loggedInUser = req.body.user._id;

  if ((!content && !attachment) || !chatId) {
    res.status(400);
    throw new Error("Invalid request params for sending a message");
  }

  let data;

  if (!!attachment) {
    data = {
      url: req?.file?.location,
      type: req?.file?.mimetype,
    };
  }

  const createdMessage = await MessageModel.create({
    sender: loggedInUser,
    fileUrl: data?.url,
    content: content || "",
    chat: chatId,
  });

  if (!createdMessage) {
    res.status(404);
    throw new Error("Message not found");
  }
  // Update the lastMessage of current chat with newly created message
  const updateChatPromise = ChatModel.findByIdAndUpdate(chatId, {
    lastMessage: createdMessage._id,
  });

  const populatedMsgPromise = MessageModel.findById(createdMessage._id)
    .populate({
      path: "sender",
      model: "User",
      select: "-notifications",
    })
    .populate({
      path: "chat",
      model: "Chat",
      select: "-groupAdmins",
    });
  // Parallel execution of independent promises
  const [updatedChat, populatedMessage] = await Promise.all([
    updateChatPromise,
    populatedMsgPromise,
  ]);

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat not found while updating lastMessage");
  }
  res.status(201).json(populatedMessage);
});

const updateMessage = asyncHandler(async (req, res) => {
  const updatedAttachment = req.file;
  const { msgFileRemoved, mediaDuration, updatedContent, messageId } = req.body;
  const fileRemoved = msgFileRemoved === "true";

  if (!messageId) {
    res.status(404);
    throw new Error("Invalid Message Id");
  }
  const existingMessage = await MessageModel.findById(messageId);

  if (!existingMessage) {
    res.status(404);
    throw new Error("Message not found");
  }

  const { file_id, fileUrl, file_name } = existingMessage;
  let attachmentData = { fileUrl, file_id, file_name };

  if (!(updatedAttachment || (file_id && !fileRemoved)) && !updatedContent) {
    res.status(400);
    throw new Error(
      "A Message Must Contain Either a File or some Text Content"
    );
  }

  if (!updatedAttachment) {
    // Attachment already exists but deleted by user while updating
    if (file_id && fileRemoved) {
      deleteExistingAttachment(fileUrl, file_id);
      attachmentData = {
        fileUrl: null,
        file_id: null,
        file_name: null,
      };
    }
  } else if (
    /(\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp)$/.test(
      updatedAttachment.originalname
    )
  ) {
    // Updated attachment is of type : image/gif
    if (file_id) deleteExistingAttachment(fileUrl, file_id);

    // Upload updated attachment to cloudinary and then delete from server
    const uploadResponse = await cloudinary.uploader.upload(
      updatedAttachment.path
    );
    attachmentData = {
      fileUrl: uploadResponse.secure_url,
      file_id: uploadResponse.public_id,
      file_name: updatedAttachment.originalname,
    };
    deleteFile(updatedAttachment.path);
  } else {
    // For any other file type, it's uploaded via uploadToS3 middleware
    attachmentData = {
      fileUrl: updatedAttachment.location || "",
      file_id: updatedAttachment.key || "",
      file_name:
        updatedAttachment.originalname +
        "===" +
        (mediaDuration !== "undefined"
          ? `${mediaDuration}+++${updatedAttachment.size}`
          : updatedAttachment.size),
    };
    if (file_id) deleteExistingAttachment(fileUrl, file_id);
  }

  const updatedMessage = await MessageModel.findByIdAndUpdate(
    messageId,
    { ...attachmentData, content: updatedContent || "" },
    { new: true }
  )
    .populate({
      path: "sender",
      model: "User",
      select: "name email profilePic",
    })
    .populate({
      path: "chat",
      model: "Chat",
      select: "-groupAdmins -cloudinary_id",
    });

  if (!updatedMessage) {
    res.status(404);
    throw new Error("Updated message not found");
  }
  res.status(200).json(updatedMessage);
});

const deleteMessages = asyncHandler(async (req, res) => {
  let { messageIds, isDeleteGroupRequest } = req.body;
  messageIds = JSON.parse(messageIds);

  if (!messageIds?.length) {
    res.status(400);
    throw new Error("Invalid messageIds for deleting message/s");
  }
  const resolvedMessage = "Successfully Deleted a Message";

  // Deleting each message attachment, message in parallel
  await Promise.all(
    messageIds.map(async (msgId) => {
      const existingMessage = await MessageModel.findById(msgId);

      if (!existingMessage) {
        res.status(404);
        throw new Error("Message to be deleted not found");
      }
      const { file_id, fileUrl } = existingMessage;

      if (file_id) deleteExistingAttachment(fileUrl, file_id);

      const deletedMessage = await MessageModel.findByIdAndDelete(msgId)
        .populate({
          path: "sender",
          model: "User",
          select: "name email",
        })
        .populate({
          path: "chat",
          model: "Chat",
        });

      // If deleted message is the last message of current chat
      if (
        !isDeleteGroupRequest &&
        JSON.stringify(msgId) ===
          JSON.stringify(deletedMessage.chat.lastMessage)
      ) {
        // Retrive the previous message
        const latestMessages = await MessageModel.find({
          chat: deletedMessage.chat._id,
        }).sort({ createdAt: "desc" }); // (latest to oldest)

        // If there's no previous message, don't update lastMessage
        if (latestMessages.length === 0) return resolvedMessage;

        // Since lastMessage was deleted, previousMessage is the latest
        const previousMessage = latestMessages[0];

        // Update the lastMessage of current chat with previous message
        const updatedChat = await ChatModel.findByIdAndUpdate(
          deletedMessage.chat._id,
          { lastMessage: previousMessage._id },
          { new: true }
        );

        if (!updatedChat) {
          res.status(404);
          throw new Error("Chat not found while updating lastMessage");
        }
      }
      return resolvedMessage;
    })
  );
  res.status(200).json({ status: "Message/s Deleted Successfully" });
});

const accessAttachment = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const params = { Bucket: s3_bucket, Key: filename };
  const fileObj = await s3.getObject(params).promise();
  res.status(200).send(fileObj.Body);
});

