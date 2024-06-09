
module.exports = Object.freeze({
  UNAUTHORISED_ERROR_CODE: "403",
  UNAUTHORISED_ERROR_MESSAGE: "You are not authorised to login to our system.",
  INVALID_USER_MESSAGE: "Invalid username or password",
  DATA_NOT_FOUND: "Data not found.",
  DATA_NOT_FOUND_ERROR_CODE: "404",
  UPDATE_NOT_DONE_ERROR_COde: "100",
  CONFLICTS: "409",
  NOT_ALLOWED: "406",
  INTERNAL_SERVER_ERROR_CODE: "500",
  INTERNAL_SERVER_ERROR_MESSAGE: "Internal server error.",
  UNABLE_TO_SAVE_MESSAGE: "Unable to save.",
  UNABLE_TO_UPDATE_MESSAGE: "Unable to update, data not found.",
  UPDATE_DONE_MESSAGE: "Update successful.",
  AUTH_ERROR: { auth: false, message: "Failed to authenticate token." },
  REQUIRED_ID: "User id is required.",
  POST_REQUIRED_ID: "Post id is required.",
});