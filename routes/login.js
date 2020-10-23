var fs = require('fs');
var Joi = require('joi');
var express = require('express');
var router = express.Router();

router.get('/login/', (req, res, next) => {
    const checkLoginUser = (db) => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        })
        const validation = schema.validate(req.body);
        if (validation.error)
            throw new Error(validation.error.details[0].message);
        return db.find(l => l.email === validation.value.email && l.password === validation.value.password);
    }
    const db = fs.readFileSync('db/user.json', 'utf-8')
    let user = null;
    try {
        user = checkLoginUser(JSON.parse(db));
    } catch (e) {
        console.log(e)
        res.status(400).json({'error': 'Validation Error'})
    }
    if (user)
        res.status(200).send('asds')
    else
        res.status(404).json({'error': 'No such user'})
});

module.exports = router;
