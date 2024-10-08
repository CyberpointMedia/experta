const userController = require("../controllers/user.controller");
const routes = require("../constants/route.url");
const { authMiddleware } = require("../middlewares/auth.middleware");
const postController = require("../controllers/post.controllers");
const uploadMiddleWare = require("../middlewares/file.middleware");
const { upload } = require("../utils/aws.utlis");

module.exports = (app) => {
  var router = require("express").Router();
  router.get("/post/detail/:postId", postController.getPostDetails);
  router.post("/posts", postController.getAllPost);
  router.get("/posts/random/:type", postController.getAllRandomPost);
  router.post(
    "/post/create",
    uploadMiddleWare.single("file"),
    authMiddleware,
    postController.createPost
  );
  router.post(
    "/post/likeUnlike/:id",
    authMiddleware,
    postController.likeUnlikePost
  );
  router.post("/post/comment/:id", authMiddleware, postController.newComment);
  router.delete("/post/comment", authMiddleware, postController.deleteComment);
  router.patch("/post/comment", authMiddleware, postController.updateComment);

  router.post("/reviews", authMiddleware, postController.createReview);
  router.get("/reviews/:userId", postController.getAllReviews);
  router.delete("/reviews/:id", postController.deleteReviewById);

  router.post("/report", authMiddleware, postController.createReport);
  router.get("/report/:id", authMiddleware, postController.getReportById);

  router.post(
    "/reasons",
    authMiddleware,
    postController.createReportReason
  );
  router.delete(
    "/reasons/:reasonId",
    authMiddleware,
    postController.deleteReportReasonById
  );
  router.delete("report/:id", authMiddleware, postController.deleteReportById);
  router.get("/reasons", postController.getReportReasons);
  app.use(routes.API, router);
};
