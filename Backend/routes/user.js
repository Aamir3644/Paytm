const express = require('express');
const zod = require('zod');
const { User } = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config');

const router = express.Router();

const signUpSchema = zod.object({
    username : zod.string().email(),
    password : zod.string(),
    firstName : zod.string(),
    lastName : zod.string()
});

// Sign Up Route
router.post("/signup", async (req,res)=>{
    const body = req.body ;
    const {success} = signUpSchema.safeParse(body);

    if(!success)
    {
        return res.status(411).json({
            message : "Email already taken / Incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username : body.username
    })

    if(existingUser){
        return res.status(411).json({
            message : "Email already taken"
        })
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    });

    const userId = user._id;

    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message : "User created successfuly",
        token : token
    })

});

const signInSchema = zod.object({
    username : zod.string().email(),
    password : zod.string()
});

// Sign In Route
router.post("/signin", async (req,res)=>{
    const {success} = signInSchema(req.body);

    if(!success){
        return res.status(411).json({
            message : "Invalid Credentials / Invalid inputs"
        })
    }

    const user = User.findOne({
        username : req.username,
        password : req.password
    })

    if (user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);
  
        res.json({
            token: token
        })
        return;
    }

    res.status(411).json({
        message: "Error while logging in"
    })

})

const updateBody = zod.object({
	password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

// Update User Data Route
router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne(req.body, {
        id: req.userId
    })

    res.json({
        message: "Updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || ""; // this line retrieves the filter query parameter 
                                           // from request URL

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})


module.exports = router;