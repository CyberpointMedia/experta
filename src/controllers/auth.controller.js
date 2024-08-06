const errorMessageConstants = require("../constants/error.messages");
const globalConstants = require("../constants/global-constants");

const jwtUtil = require("../utils/jwt.utils");

const authService = require("../services/auth.service");
// const userService = require("../services/user.service");

const createResponse = require("../utils/response");

const { AuthenticationError,ValidationError } = require("../errors/custom.error");

exports.handleLogin = async (req, res) => {
  if (!req.body.phoneNo || "" == req.body.phoneNo) {
    res.send(createResponse.invalid("Phone number cannot be empty"));
    return;
  }
  try {
    let responseData = await authService.login(req.body.phoneNo);
    res.json(responseData);
  } catch (e) {
    if (e instanceof AuthenticationError) {
      res.status(403);
      res.json(
        createResponse.unauthorized(
          e.errorCode,
          "You are unauthorized.",
          e.message
        )
      );
    } else {
      console.log(e.message);
      res.status(403);
      res.json(
        createResponse.unauthorized(
          globalConstants.UNAUTHORIZED_ACCESS_CODE,
          "You are unauthorized.",
          e.message
        )
      );
    }
  }
};

exports.register = async (req, res) => {
  if (
    (!req.body.email || "" == req.body.email) &&
    (!req.body.phoneNo || "" == req.body.phoneNo) &&
    (!req.body.firstName || "" == req.body.firstName)
  ) {
    res.send(
      createResponse.invalid("firstName,email and phone number  required")
    );
    return;
  }
  if (!req.body.email || "" == req.body.email) {
    res.send(createResponse.invalid("Email cannot be empty"));
    return;
  }
  if (!req.body.phoneNo || "" == req.body.phoneNo) {
    res.send(createResponse.invalid("Phone number cannot be empty"));
    return;
  }
  if (!req.body.firstName || "" == req.body.firstName) {
    res.send(createResponse.invalid("First name cannot be empty"));
    return;
  }
  try {
    let responseData = await authService.validateUser(req.body);
    // responseData["token"] = await jwtUtil.generateToken(responseData.data);
    res.json(responseData);
    return;
  } catch (e) {
    console.log(e.message);
    response = {
      errorCode: errorMessageConstants.INTERNAL_SERVER_ERROR_CODE,
      errorMessage: e.message,
    };
    return res.json(createResponse.error(response));
  }
};

exports.verifyOtp = async (req, res) => {
  if (
    (!req.body.phoneNo || "" == req.body.phoneNo) &&
    (!req.body.otp || "" == req.body.otp)
  ) {
    res.send(createResponse.invalid("Phone numer and otp  required"));
    return;
  }
  if (!req.body.otp || "" == req.body.otp) {
    res.send(createResponse.invalid("otp cannot be empty"));
    return;
  }
  if (!req.body.phoneNo || "" == req.body.phoneNo) {
    res.send(createResponse.invalid("Phone number cannot be empty"));
    return;
  }
  try {
    let responseData = await authService.verifyOtp(req.body);
    res.json(responseData);
    return;
  } catch (e) {
    console.log(e.message);
    if (e instanceof AuthenticationError) {
      res.status(403);
      res.json(
        createResponse.unauthorized(
          e.errorCode,
          "You are unauthorized.",
          e.message
        )
      );
    } else {
      console.log(e.message);
      res.status(403);
      res.json(
        createResponse.unauthorized(
          globalConstants.UNAUTHORIZED_ACCESS_CODE,
          "You are unauthorized.",
          e.message
        )
      );
    }
  }
};

exports.resendOtp = async (req, res) => {
  if (!req.body.phoneNo || "" == req.body.phoneNo) {
    res.send(createResponse.invalid("Phone number cannot be empty"));
    return;
  }
  try {
    let responseData = await authService.resendOtp(req.body.phoneNo);
    res.json(responseData);
    return;
  } catch (e) {
    console.log(e.message);
    if (e instanceof AuthenticationError) {
      res.status(403);
      res.json(
        createResponse.unauthorized(
          e.errorCode,
          "You are unauthorized.",
          e.message
        )
      );
    } else {
      console.log(e.message);
      res.status(403);
      res.json(
        createResponse.unauthorized(
          globalConstants.UNAUTHORIZED_ACCESS_CODE,
          "You are unauthorized.",
          e.message
        )
      );
    }
  }
};

exports.initiateEmailChange = async (req, res) => {
  if (!req.body.newEmail || req.body.newEmail === "") {
    return res
      .status(400)
      .json(createResponse.invalid("New email cannot be empty"));
  }
  try {
    let responseData = await authService.initiateEmailChange(
      req.body.user._id,
      req.body.newEmail
    );
    res.json(responseData);
  } catch (e) {
    console.log(e.message);
    if (e instanceof AuthenticationError || e instanceof ValidationError) {
      res.status(400);
      res.json(
        createResponse.error({
          errorCode: e.errorCode,
          errorMessage: e.message,
        })
      );
    } else {
      res.status(500);
      res.json(
        createResponse.error({
          errorCode: errorMessageConstants.INTERNAL_SERVER_ERROR_CODE,
          errorMessage: "An unexpected error occurred.",
        })
      );
    }
  }
};

exports.verifyOtpAndChangeEmail = async (req, res) => {
  if (!req.body.otp || req.body.otp === "") {
    return res.status(400).json(createResponse.invalid("OTP cannot be empty"));
  }
  if (!req.body.newEmail || req.body.newEmail === "") {
    return res
      .status(400)
      .json(createResponse.invalid("New email cannot be empty"));
  }
  try {
    let responseData = await authService.verifyOtpAndChangeEmail(
      req.body.user._id,
      req.body.otp,
      req.body.newEmail
    );
    res.json(responseData);
  } catch (e) {
    console.log(e.message);
    if (e instanceof AuthenticationError || e instanceof ValidationError) {
      res.status(400);
      res.json(
        createResponse.error({
          errorCode: e.errorCode,
          errorMessage: e.message,
        })
      );
    } else {
      res.status(500);
      res.json(
        createResponse.error({
          errorCode: errorMessageConstants.INTERNAL_SERVER_ERROR_CODE,
          errorMessage: "An unexpected error occurred.",
        })
      );
    }
  }
};
