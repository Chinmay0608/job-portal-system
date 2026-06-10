const User =
  require("../models/user");

const updateProfile =
  async (req, res) => {

    try {

      const {
        name,
      } = req.body;

      const updatedUser =
        await User.findByIdAndUpdate(

          req.user.id,

          {
            name,

            resume:
              req.file?.path,
          },

          {
            new: true,
          }
        );

      res.status(200)
        .json({
          message:
            "Profile updated successfully",

          user:
            updatedUser,
        });

    } catch (error) {

      console.log(error);

      res.status(500)
        .json({
          message:
            "Server Error",
        });
    }
  };

module.exports = {
  updateProfile,
};