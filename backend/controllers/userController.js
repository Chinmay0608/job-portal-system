const User =
  require("../models/user");

const updateProfile =
  async (req, res) => {
    console.log(
      "UPDATE ROUTE HIT"
    );
    try {

      console.log(req.files);
      console.log(req.body);
      console.error(error);

      const {
        name,
        phone,
        location,
        linkedin,
        github,
        about,
        skills,
      } = req.body;

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User not found",
          });
      }

      user.name =
        name || user.name;

      user.phone =
        phone || "";

      user.location =
        location || "";

      user.linkedin =
        linkedin || "";

      user.github =
        github || "";

      user.about =
        about || "";

      user.skills =
        skills
          ? JSON.parse(
              skills
            )
          : [];

      /* Resume */
      if (
        req.files?.resume?.[0]
      ) {
        user.resume =
          req.files
            .resume[0]
            .path;
      }

      /* Profile Image */
      if (
        req.files
          ?.profileImage?.[0]
      ) {
        user.profileImage =
          req.files
            .profileImage[0]
            .path;
      }

      await user.save();

      res.status(200).json({
        message:
          "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        message:
          "Profile update failed",
      });
    }
  };

module.exports = {
  updateProfile,
};