import bcrypt from "bcrypt";
import mongoose from "mongoose";
import validator from "validator";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Lütfen isminizi giriniz"],
        },
        email: {
            type: String,
            required: [true, "Lütfen email adresinizi giriniz"],
            unqiue: [true, "Bu email adresi zaten kullanılmaktadır"],
            lowercase: true,
            validate: [validator.isEmail, "Lütfen geçerli bir email adresi giriniz"],
        },
        phonenumber: {
            type: String,
            default: "",
        },
        picture: {
            type: String,
            default:
                "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User",
        },
        type: {
            type: String
        },

        status: {
            type: String,
            default: process.env.DEFAULT_STATUS_MESSAGE,
        },
        password: {
            type: String,
            required: [true, "Lütfen şifrenizi giriniz"],
            minLength: [
                6,
                "Şifrenizin en az 6 karakter uzunluğunda olması gerekmektedir",
            ],
            maxLength: [128, "Şifreniz en fazla 128 karakter olabilir"],
        },
    },
    {
        collection: "users",
        timestamps: true,
    }
);
userSchema.pre("save", async function (next) {
    try {
        if (this.isNew) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(this.password, salt);
            this.password = hashedPassword;
        }
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.statics.checkPhoneNumberExists = async function (phoneNumber) {
    const user = await this.findOne({phonenumber: phoneNumber});
    return !!user;
};

userSchema.statics.findByPhoneNumber = async function (phoneNumber) {
    const user = await this.findOne({phonenumber: phoneNumber});
    return user;
};

const UserModel =
    mongoose.models.UserModel || mongoose.model("UserModel", userSchema);

export default UserModel;
