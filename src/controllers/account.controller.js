const AuthService = require("../middleware/auth.middleware");
const { UserModel } = require("../models/user.model");

const current_time = Math.floor(Date.now() / 1000);
const timeLogin = current_time + 3 * 60 * 60;
const timeOfRefreshToken = current_time + 30 * 24 * 60 * 60; // 30 ngày tính bằng giây;

class AccountColtroller {
    /** get app token */
    static getAppToken = async (req, res) => {
        try {
            const findById = await UserModel.findById(res.id)
            if(!findById) return res.status(403).json({errors: 'forbidden errors'})
            const {token} = await AuthService.generateToken({id: findById._id}, '60d')
            res.status(200).json({token})
        } catch (err) {
            res.status(500).json(err);
        }
    }

    /** login */
    static userLogin = async (req, res) => {
        try{
            const {userName, password} = req.body;
            
            const checkUserName = await UserModel.findOne({userName});
            const checkUserNameWithEmail = await UserModel.findOne({email: userName});

            if(!checkUserName && !checkUserNameWithEmail) {
                return res.status(404).json({message: 'user name or email is not correct'})
            }

            if(checkUserName) {
                const checkPass = await AuthService.comparePassWord(password, checkUserName.password)
                if(!checkPass) return res.status(401).json({message: 'password is not correct'})

                const {token} = await AuthService.generateToken({id: checkUserName._id}, timeLogin);
                const refeshToken = await AuthService.generateToken({id: checkUserName._id}, timeOfRefreshToken)
                const deCode = AuthService.verifyToken(token);

                res.status(200).json({token, refeshToken: refeshToken.token, exp: deCode.exp})
            } else if(checkUserNameWithEmail) {

                const checkPass = await AuthService.comparePassWord(password, checkUserNameWithEmail.password)
                if(!checkPass) return res.status(401).json({message: 'password is not correct'})

                const {token} = AuthService.generateToken({id: checkUserNameWithEmail._id}, timeLogin);
                const refeshToken = AuthService.generateToken({id: checkUserNameWithEmail._id}, timeOfRefreshToken);

                const deCode = AuthService.verifyToken(token);
                res.status(200).json({token, refeshToken: refeshToken.token, exp: deCode.exp})
            }

        } catch (err) {
            res.status(500).json(err)
        }
    }
    
    /** get profile */
    static fetchProfile = async (req, res) => {
        try {
            const findById = await UserModel.findById(res.id).populate('userType');
            if(!findById) return res.status(404).json({message: "user not found"});
            res.status(200).json(findById);
        } catch (err) {
            res.status(500).json(err);
        }
    }

}

module.exports = AccountColtroller;
