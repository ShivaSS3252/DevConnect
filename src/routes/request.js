const express = require("express");
const requestRouter = express.Router();
const { userauth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const Bookmark = require("../models/bookmark");

requestRouter.post(
  "/request/send/:status/:toUserId",
  userauth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;
      let { message } = req.body; // Extract message from request body
      const allowedStatus = ["ignored", "interested"];

      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status type: " + status });
      }

      // Ensure message is not included when status is "ignored"
      if (status === "ignored" && message) {
        return res.status(400).json({
          message: "Message should not be provided when status is 'ignored'",
        });
      }

      // Check if there is an existing connection request
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnectionRequest) {
        if (existingConnectionRequest.status === "unfollowed") {
          // Allow resending request by updating status to "pending"
          existingConnectionRequest.status = status;
          if (status !== "ignored" && message) {
            existingConnectionRequest.message = message;
          }
          await existingConnectionRequest.save();
          return res.status(200).json({
            message: `Connection request sent again as ${status}`,
            data: existingConnectionRequest,
          });
        }
        return res.status(400).send({
          message: "Connection Request Already Exists",
        });
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Mutual Connection Calculation
      const fromUserIdConnect = await ConnectionRequest.find({
        $or: [{ fromUserId }, { toUserId: fromUserId }],
        status: "accepted",
      }).select("fromUserId toUserId");

      const toUserIdConnect = await ConnectionRequest.find({
        $or: [{ fromUserId: toUserId }, { toUserId }],
        status: "accepted",
      }).select("fromUserId toUserId");

      const fromUserConnectionsSet = new Set(
        fromUserIdConnect.flatMap((conn) => [
          conn.fromUserId.toString(),
          conn.toUserId.toString(),
        ])
      );
      const toUserConnectionsSet = new Set(
        toUserIdConnect.flatMap((conn) => [
          conn.fromUserId.toString(),
          conn.toUserId.toString(),
        ])
      );

      const mutualconnections = [...fromUserConnectionsSet].filter((id) =>
        toUserConnectionsSet.has(id)
      );

      // Create a new connection request (without message for ignored status)
      const connectionRequestData = {
        fromUserId,
        toUserId,
        status,
      };

      if (status !== "ignored" && message) {
        connectionRequestData.message = message; // Include message only if status is NOT "ignored"
      }

      const connectionRequest = new ConnectionRequest(connectionRequestData);
      const data = await connectionRequest.save();

      res.json({
        message: `${req.user.firstName} is ${status} in ${toUser.firstName}`,
        mutualConnectionsCount: mutualconnections.length,
        data,
      });
    } catch (err) {
      res.status(400).send("Error: " + err.message);
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userauth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;
      //validate the status
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Status not allowed" });
      }
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "Connection request not found" });
      }
      connectionRequest.status = status;
      const data = await connectionRequest.save();
      res.json({ message: "Connection Request " + status, data });
      //writter=>Reader
      //Is Reader(touserid) loggedIn user
      //status=interested
      //requestId should be valid
    } catch (err) {
      res.status(400).send("Error: " + err.message);
    }
  }
);

requestRouter.get("/request/IgnoredList", userauth, async (req, res) => {
  try {
    const userId = req.user._id; // Get logged-in user ID

    // Fetch both 'ignored' and 'rejected' requests
    const requests = await ConnectionRequest.find({
      fromUserId: userId, // Fetch requests sent by the user
      status: { $in: ["ignored", "rejected"] },
    }).populate("toUserId", "firstName lastName about"); // Populate user details

    // Fetch active bookmarks
    const activeBookmarks = await Bookmark.find({
      userId: userId,
      status: "active",
    }).select("bookmarkedUserId");

    const bookmarkedUserIds = new Set(
      activeBookmarks.map((b) => b.bookmarkedUserId.toString())
    );

    // Attach `isBookmarked` to each user in `requests`
    const modifiedRequests = requests.map((request) => ({
      ...request.toObject(),
      toUserId: {
        ...request.toUserId.toObject(),
        isBookmarked: bookmarkedUserIds.has(request.toUserId._id.toString()),
      },
    }));

    res.status(200).json({ data: modifiedRequests });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching requests: " + err.message });
  }
});
requestRouter.post("/request/unfollow/:userId", userauth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const targetUserId = req.params.userId;

    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Delete the connection request instead of updating the status
    const updatedConnection = await ConnectionRequest.findOneAndUpdate(
      {
        $or: [
          {
            fromUserId: loggedInUser._id,
            toUserId: targetUserId,
            status: "accepted",
          },
          {
            fromUserId: targetUserId,
            toUserId: loggedInUser._id,
            status: "accepted",
          },
        ],
      },
      { status: "unfollowed" },
      { new: true }
    );

    if (!updatedConnection) {
      return res.status(404).json({ message: "No active connection found" });
    }

    res.json({ message: "Successfully unfollowed and removed connection" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = requestRouter;
