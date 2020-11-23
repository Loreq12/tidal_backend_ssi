//import authorize from './authorization'
let auth =  require('./authorization')

var fs = require('fs');
var Joi = require('joi');
var express = require('express');
var router = express.Router();

// authorisation: ALL
router.post('/register/', function (req,res, next){
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
    const validation = schema.validate(req.body);
    if (validation.error){
        res.status(400).json({'error': 'Validation Error'})
        return;
    }
    const db = fs.readFileSync('db/user.json', 'utf-8')
    let data_base = JSON.parse(db)
    console.log(data_base)

    let new_id = 0
    data_base.forEach(user => {if(user.id >= new_id) new_id = user.id +1})
    data_base.push({id:new_id,
        email: req.body.email,
        password: req.body.password,
        access: 'USER',
        blocked:false})

    let new_db = JSON.stringify(data_base)
    fs.writeFileSync('db/user.json', new_db, 'utf-8')

    res.status(201).send({'result':'account created'})
})

// router.use((req, res, next) =>{
//     console.log("middleware")
//     next()
// })

// authorisation: ALL
router.get('/login/', (req, res, next) => {
    console.log(req.body)
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
        res.status(200).send({'result':'logged in'})
    else
        res.status(404).json({'error': 'No such user'})
});


// authorisation: ADMIN
router.put('/updateAccount/', function (req,res, next){
    const schema = Joi.object({
        admin_id: Joi.number().required(),
        id: Joi.number().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        access: Joi.string().valid('USER','ARTIST','ADMIN').required(),
        blocked: Joi.boolean().required()
    })
    const validation = schema.validate(req.body);
    if (validation.error) {
        res.status(400).json({'error': 'Validation Error'})
        return;
    }
    const db = fs.readFileSync('db/user.json', 'utf-8')
    let data_base = JSON.parse(db)

    if(!auth.authorize(req.body.admin_id, ['ADMIN'])){
        res.status(400).send({'error':"failed authorization"});
        return;
    }

    console.log(data_base);
    console.log("BODY", req.body);

    let index = data_base.findIndex( user => {return user.id === req.body.id;});
    if(index<0){
        res.status(404).json({'error': 'Index not found'});
        return;
    }
    console.log("IDEX: ", index);
    console.log("USER: ", data_base[index]);
    data_base[index].email = req.body.email;
    data_base[index].password = req.body.password;
    data_base[index].access = req.body.access;
    data_base[index].blocked = (req.body.blocked == 'true');

    console.log(data_base);
    let new_db = JSON.stringify(data_base)
    fs.writeFileSync('db/user.json', new_db, 'utf-8')

    res.status(200).send({'result':"changed data"});
})

// authorisation: ADMIN
router.delete('/deleteAccount/', function (req,res, next){
    const schema = Joi.object({
        admin_id : Joi.number().required(),
        id: Joi.number().required(),
    })
    const validation = schema.validate(req.body);
    if (validation.error) {
        res.status(400).json({'error': 'Validation Error'})
        return;
    }

    if(!auth.authorize(req.body.admin_id, ['ADMIN'])){
        res.status(400).send({'error':"failed authorization"});
        return;
    }

    const db = fs.readFileSync('db/user.json', 'utf-8')
    let data_base = JSON.parse(db)

    console.log(data_base);
    console.log("BODY", req.body);

    let index = data_base.findIndex( user => {return user.id === req.body.id;});
    if(index<0){
        res.status(404).json({'error': 'Index not found'})
        return;
    }
    console.log("IDEX: ", index)
    console.log("USER: ", data_base[index])
    data_base.splice(index, 1)

    console.log(data_base);
    let new_db = JSON.stringify(data_base)
    fs.writeFileSync('db/user.json', new_db, 'utf-8')

    res.status(200).send({'result':"account deleted"})
})


module.exports = router;
