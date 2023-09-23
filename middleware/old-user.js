const User = require("../models/user");
const Joi = require("joi");

// !!!!! The server validates the credentials but only returns a validation failed message if it fails - individual validation errors are not sent back. 
// The code is there to send back the individual details, but going to validate on front end anyway so seems overdesigned to send
// Do reuse the validation error code for the front end though!
const validateAuthCredentials = (req, res, next) => {
    const { email, password } = req.body;
    // const passwordMinCharacters = 8;

    const schema = Joi.object({
        email: Joi.string()
            .required()
            .email()
            /*.messages({
                "any.required": "Please enter a valid email address",
                "string.email": "Please enter a valid email address"
            })*/,
        password: Joi.string()
            .required()
            .min(8)
            /*.messages({
                "any.required": `Please enter a valid password (min. ${passwordMinCharacters} characters)`,
                "string.empty": `Password must be at least ${passwordMinCharacters} characters`,
                "string.min": `Password must be at least ${passwordMinCharacters} characters`
            })*/,
    });

    const { error: validationError } = schema.validate({ email, password }, /*{abortEarly: false}*/);

    if (validationError) {
        // const errors = validationError.details.map(detail => ({
        //     input: detail.context.label,
        //     validationError: detail.message
        // }));
        
        //res.status(400).send({message: "Validation failed", validationErrors: errors});

        next({status: 400, message: "Validation failed"});
        return;
    }
    next();
};

module.exports.validateUserProfile = (req, res, next) => {
    const { firstName } = req.body;

    const schema = Joi.object({
        firstName: Joi.string()
        .max(35)
        /*.messages({
            "string.empty": "Please enter a first name",
            "string.max": "Please enter a valid first name (max. 35 characters)"
        })*/
    });

    const { error: validationError } = schema.validate({ firstName })

    if (validationError) {
        next({status: 400, message: "Validation failed"});
        return;
    }
    next();
};


