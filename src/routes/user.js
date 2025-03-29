const express = require("express");
const { userauth } = require("../middlewares/auth");
const userRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const user = require("../models/user");
const Bookmark = require("../models/bookmark");

//Get all the pending connection request for the loggedIn user
const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";
userRouter.get("/user/requests/received", userauth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", [
      "firstName",
      "lastName",
      "age",
      "gender",
      "about",
      "skills",
    ]);
    res.json({
      message: "Data fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});
userRouter.get("/user/connections", userauth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);
    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });
    res.json({
      message: "Data fetched successfully",
      data,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});
userRouter.get("/feed", userauth, async (req, res) => {
  try {
    //user should see all the user cards except his own card
    //should not see card of his connections which he already accepted
    //should not see card of profiles who have ignored
    //already sent the connection request
    //Example:F=[A,B,C,D,E]
    //F->A(rejected) F->B(accepted) -->[C,D,E]

    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 30;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;
    //Find all connection requests(sent+received)
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    // const connectionRequestsAccepted = await ConnectionRequest.find({
    //   $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    //   status: "accepted",
    // }).select("fromUserId toUserId");
    const userConnections = new Set();
    // connectionRequestsAccepted.forEach((req) => {
    //   userConnections.add(req.fromUserId.toString());
    //   userConnections.add(req.toUserId.toString());
    // });
    const hideUsersFromFeed = new Set();
    const activeRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      status: { $in: ["ignored", "interested", "accepted", "rejected"] }, // Exclude only these
    }).select("fromUserId toUserId");

    activeRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });
    // connectionRequests.forEach((req) => {
    //   hideUsersFromFeed.add(req.fromUserId.toString());
    //   hideUsersFromFeed.add(req.toUserId.toString());
    // });
    const userQuery = {
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    };
    let skillFilter = req.query.skills ? req.query.skills.split(",") : [];

    // Convert all skill filters to lowercase
    skillFilter = skillFilter.map((skill) => skill.toLowerCase());
    if (skillFilter.length > 0) {
      userQuery.skills = {
        $in: skillFilter.map((skill) => new RegExp(skill, "i")), // Partial + Case-Insensitive Match
      };
    }
    const users = await user
      .find(userQuery)
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    const activeBookmarks = await Bookmark.find({
      userId: loggedInUser._id,
      status: "active",
    }).select("bookmarkedUserId");

    const bookmarkedUserIds = new Set(
      activeBookmarks.map((b) => b.bookmarkedUserId.toString())
    );
    const feedWithMutualConnections = await Promise.all(
      users.map(async (User) => {
        const targetUserConnections = await ConnectionRequest.find({
          $or: [{ fromUserId: User._id }, { toUserId: User._id }],
          status: "accepted",
        }).select("fromUserId toUserId");
        const targetUserConnectionSet = new Set();
        targetUserConnections.forEach((req) => {
          targetUserConnectionSet.add(req.fromUserId.toString());
          targetUserConnectionSet.add(req.toUserId.toString());
        });

        // Find mutual connections by intersecting sets
        const mutualConnectionIds = [...userConnections].filter((conn) =>
          targetUserConnectionSet.has(conn)
        );

        // 🔹 Fetch firstName & lastName of mutual connections
        let mutualConnectionUsers = [];
        if (mutualConnectionIds.length > 0) {
          const mutualUsers = await user
            .find({
              _id: { $in: mutualConnectionIds },
            })
            .select("firstName lastName");

          mutualConnectionUsers = mutualUsers.map(
            (u) => `${u.firstName} ${u.lastName}`
          );
        }

        return {
          ...User.toObject(),
          mutualConnections: mutualConnectionIds.length,
          mutualConnectionUsers,
          isBookmarked: bookmarkedUserIds.has(User._id.toString()),
        };
      })
    );
    res.json({ data: feedWithMutualConnections });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
userRouter.post("/bookmark", userauth, async (req, res) => {
  try {
    const { bookmarkedUserId } = req.body;
    const loggedInUser = req.user;

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      userId: loggedInUser._id,
      bookmarkedUserId,
    });

    if (existingBookmark) {
      return res.status(400).json({ message: "User already bookmarked!" });
    }

    // Save bookmark
    const newBookmark = new Bookmark({
      userId: loggedInUser._id,
      bookmarkedUserId,
      status: "active", // Set status correctly
    });

    await newBookmark.save();
    res.status(201).json({ message: "User bookmarked successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// 🔹 Get all bookmarked profiles
userRouter.get("/bookmarked-profiles", userauth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Find all bookmarked (active) user IDs
    const activeBookmarks = await Bookmark.find({
      userId: loggedInUser._id,
      status: "active",
    }).select("bookmarkedUserId");

    const removedBookmarks = await Bookmark.find({
      userId: loggedInUser._id,
      status: "removed",
    }).select("bookmarkedUserId");

    const activeUserIds = activeBookmarks.map((b) => b.bookmarkedUserId);
    const removedUserIds = removedBookmarks.map((b) => b.bookmarkedUserId);

    // Fetch user details for both active and removed bookmarks
    const activeProfiles = await user
      .find({ _id: { $in: activeUserIds } })
      .select("firstName lastName about skills photoUrl");
    const removedProfiles = await user
      .find({ _id: { $in: removedUserIds } })
      .select("firstName lastName about skills photoUrl");

    res.json({
      bookmarkedProfiles: activeProfiles,
      previouslyBookmarkedProfiles: removedProfiles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔹 Remove a bookmark
userRouter.delete("/bookmark/:id", userauth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { id } = req.params;

    const bookmark = await Bookmark.findOneAndUpdate(
      { userId: loggedInUser._id, bookmarkedUserId: id },
      { status: "removed" },
      { new: true }
    );

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found!" });
    }

    res.json({ message: "Bookmark removed successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
userRouter.delete("/bookmarkFeed/:id", userauth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { id } = req.params;

    const bookmark = await Bookmark.findOneAndDelete({
      userId: loggedInUser._id,
      bookmarkedUserId: id,
    });

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found!" });
    }

    res.json({ message: "Bookmark removed successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
userRouter.put("/bookmark/:id", userauth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { id } = req.params;

    const bookmark = await Bookmark.findOneAndUpdate(
      { userId: loggedInUser._id, bookmarkedUserId: id },
      { status: "active" },
      { new: true }
    );

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found!" });
    }

    res.json({ message: "Bookmark added again!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = userRouter;
