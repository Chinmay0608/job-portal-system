import { useState } from "react";
import toast from "react-hot-toast";
import { updateProfile } from "../Services/jobService";

function Profile() {

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const [
    name,
    setName,
  ] = useState(
    user?.name || ""
  );

  const [
    resume,
    setResume,
  ] = useState(null);

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        const formData =
          new FormData();

        formData.append(
          "name",
          name
        );

        if (resume) {

          formData.append(
            "resume",
            resume
          );
        }

        const response =
          await updateProfile(
            formData
          );

        toast.success(
          response.message
        );

        localStorage.setItem(
          "user",

          JSON.stringify(
            response.user
          )
        );

      } catch (error) {

        console.log(error);

        toast.error(
          "Profile update failed"
        );
      }
    };

  return (

    <div
      className="
        container
        py-5
      "
      style={{
        marginTop:
          "95px",
      }}
    >

      <div
        className="
          card
          border-0
          shadow-sm
          p-4
        "
        style={{
          borderRadius:
            "28px",

          maxWidth:
            "580px",

          margin:
            "auto",
        }}
      >

        {/* Header */}

        <div
          className="
            d-flex
            align-items-center
            gap-2
            mb-4
          "
        >

          <div
            style={{
              width:
                "65px",

              height:
                "65px",

              borderRadius:
                "50%",

              background:
                "#07111f",

              color:
                "white",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              fontSize:
                "1.4rem",

              fontWeight:
                "700",
            }}
          >
            {
              user?.name
                ?.charAt(0)
                .toUpperCase()
            }
          </div>

          <div>

            <h3
              className="
                fw-bold
                mb-1
              "
            >
              {user?.name}
            </h3>

            <p
              className="
                text-muted
                mb-2
              "
            >
              {user?.email}
            </p>

            <span
              className="
                badge
                bg-dark
                px-2
                py-1
              "

              style={{
                fontSize:
                  "0.75rem",
              }}
            >
              {user?.role}
            </span>

          </div>

        </div>

        <h2
          className="
            fw-bold
            mb-3
          "
          style={{
          fontSize:
            "2rem",
        }}
        >
          My Profile
        </h2>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <label className="mb-2">
            Full Name
          </label>

          <input
            type="text"
            className="
              form-control
              mb-3
            "
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
          />

          <label className="mb-2">
            Email
          </label>

          <input
            type="email"
            className="
              form-control
              mb-3
            "
            value={
              user?.email
            }
            disabled
          />

          <label className="mb-2">
            Update Resume
          </label>

          <input
            type="file"
            className="
              form-control
              mb-3
            "
            accept="
              .pdf,
              .doc,
              .docx
            "
            onChange={(e) =>
              setResume(
                e.target.files[0]
              )
            }
          />

          {user?.resume && (

            <a
              href={
                user.resume.startsWith(
                  "http"
                )
                  ? user.resume
                  : `http://localhost:5000/${user.resume.replace(/^\/+/, "")}`
              }

              target="_blank"

              rel="
                noreferrer
              "

              className="
                btn
                btn-outline-dark
                w-100
                mb-3
              "
            >
              View Current Resume
            </a>
          )}

          <button
            className="
              btn
              btn-dark
              w-100
              py-2
            "
          >
            Save Profile
          </button>

        </form>

      </div>

    </div>
  );
}

export default Profile;