var fs = require('fs');
var Joi = require('joi');
var express = require('express');
var router = express.Router();
let auth =  require('./authorization')

function createMusicEntry(id, title, author, duration, musicFileDir, pictureFileDir){
  let entry = {
    id: id,
    title: title,
    author: author,
    musicFileDir: musicFileDir,
    pictureFileDir: pictureFileDir
  };

  return entry;
}
// authorisation: ALL
router.get('/musiclist', function(req, res, next) {
  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)

  res.status(200).send(data_base);
});

// authorisation: ALL
router.get('/musiclist/author', function(req, res, next) {
  const schema = Joi.object({
    author: Joi.string().required()
  })
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }

  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)

  ret_data = [];

  data_base.forEach(music => {
    if(music.author.indexOf(req.body.author) !== -1 ){
      ret_data.push(music);
    }
  })

  res.status(200).send(ret_data);
});

// authorisation: ALL
router.get('/musiclist/title', function(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required()
  })
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }

  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)

  ret_data = [];

  data_base.forEach(music => {
    if(music.title.indexOf(req.body.title) !== -1 ){
      ret_data.push(music);
    }
  })

  res.status(200).send(ret_data);
});

// authorisation: ARTIST/ADMIN
//change list entry
router.put('/musiclist/', function(req, res, next) {
  const schema = Joi.object({
    admin_id: Joi.number().required(),
    id: Joi.number().required(),
    title: Joi.string().required(),
    author: Joi.string().required()
  })
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return ;
  }
  if(!auth.authorize(req.body.admin_id, ['ADMIN','ARTIST'])){
    res.status(400).json({'error': 'Failed Authorization'})
    return;
  }

  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)

  let entry = data_base.find( (entry)=>{return entry.id === Number(req.body.id);})
  if(!entry){
    res.status(404).send({'error':'Index not found'});
    return;
  }
  entry.title = req.body.title;
  entry.author = req.body.author;


  console.log(data_base)

  let new_db = JSON.stringify(data_base)
  fs.writeFileSync('db/music.json', new_db, 'utf-8')

  res.status(200).send({'result':'data changed'});
});

// authorisation: ADMIN
//delete entry
router.delete('/musiclist/', function(req, res, next) {
  const schema = Joi.object({
    admin_id: Joi.number().required(),
    id: Joi.number().required(),
  })
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }
  if(!auth.authorize(req.body.admin_id, ['ADMIN'])){
    res.status(400).json({'error': 'Failed Authorization'})
    return;
  }
  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)

  let remove_index = data_base.find((entry)=>{return entry.id === Number(req.body.id);});
  if(remove_index <0){
    res.status(404).json({'error': 'Index not found'})
    return;
  }
  data_base.splice(remove_index,1)

  //console.log(data_base)
  console.log(remove_index);

  let new_db = JSON.stringify(data_base)
  fs.writeFileSync('db/music.json', new_db, 'utf-8')

  res.status(200).send({'result':'entry deleted'})
});

//done
// authorisation: ARTIST/ADMIN
// add entry (with file upload?)
router.post('/musiclist/', function (req,res, next){
  const schema = Joi.object({
    admin_id: Joi.number().required(),
    title: Joi.string().required(),
    author: Joi.string().required()
  })

  console.log(req.body)

  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }
  if(!auth.authorize(req.body.admin_id, ['ADMIN','ARTIST'])){
    res.status(400).json({'error': 'Failed Authorisation'})
    return;
  }
  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)
  console.log(data_base)

  let new_id = 1
  data_base.forEach(music => {if(music.id >= new_id) new_id = music.id +1})
  data_base.push(createMusicEntry(new_id,
      req.body.title,
      req.body.author, "","", "" ))

  let new_db = JSON.stringify(data_base)
  fs.writeFileSync('db/music.json', new_db, 'utf-8')

  res.status(200).json({'id': new_id})
})

//var multer  = require('multer');
// var upload = multer({ dest: 'upload/'});
// var type = upload.single('music_file')

//done
// authorisation: ARTIST/ADMIN
router.post('/uploadMusic', function (req,res, next){
  const schema = Joi.object({
    admin_id: Joi.number().required(),
    music_id: Joi.number().required(),
  })
  const file_schema = Joi.object({
    music_file : Joi.object().required()
  })

  const validation = schema.validate(req.body);
  const file_validation = file_schema.validate(req.files);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    throw new Error(validation.error.details[0].message);
  }
  if(file_validation.error){
    res.status(400).json({'error': 'Validation Error'})
    throw new Error(validation.error.details[0].message);
  }
  if(!auth.authorize(req.body.admin_id, ['ADMIN','ARTIST'])){
    res.status(400).json({'error': 'Failed Authorization'})
    return;
  }
  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)
  let index = data_base.findIndex((elem)=>{return elem.id ===  Number(req.body.music_id)});
  if(index<0){
    res.status(404).json({'error': 'Index not Found'})
    return;
  }
  let musicDir = "./db/musicTracks/"+ req.files.music_file.name;
  data_base[index].musicFileDir = musicDir;

  console.log(`UPLOADING FILE: `, req.body, req.files, " id: ", req.body.music_id)
  fs.writeFile(musicDir, req.files.music_file.data, (err)=>{
    if(err) throw err;
  })

  let new_db = JSON.stringify(data_base)
  fs.writeFileSync('db/music.json', new_db, 'utf-8')
  res.status(200).json({'result': 'Data Uploaded'})
})

//done
// authorisation: ARTIST/ADMIN
router.post('/uploadPicture', function (req,res, next){
  const schema = Joi.object({
    admin_id: Joi.number().required(),
    music_id: Joi.number().required(),
  })
  const file_schema = Joi.object({
    picture_file : Joi.object().required()
  })

  const validation = schema.validate(req.body);
  const file_validation = file_schema.validate(req.files);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    throw new Error(validation.error.details[0].message);
  }
  if(file_validation.error){
    res.status(400).json({'error': 'Validation Error'})
    return;
  }
  if(!auth.authorize(req.body.admin_id, ['ADMIN','ARTIST'])){
    res.status(400).json({'error': 'Failed Authorization'})
    return;
  }
  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)
  let index = data_base.findIndex((elem)=>{return elem.id === Number(req.body.music_id)});
  if(index<0){
    res.status(404).json({'error': 'Index not found'})
    return;
  }
  let pictureDir = req.files.picture_file.name;
  data_base[index].pictureFileDir = pictureDir;

  console.log(`UPLOADING FILE: `, req.body, req.files, " id: ", req.body.music_id)
  fs.writeFile('./db/pictures/' + pictureDir, req.files.picture_file.data, (err)=>{
    if(err) throw err;
  })

  let new_db = JSON.stringify(data_base)
  fs.writeFileSync('db/music.json', new_db, 'utf-8')
  res.status(200).json({'result': 'Data Uploaded'})
})

// router.get('/picture', function (req,res,next){
//   const schema = Joi.object({
//     music_id: Joi.number().required()
//   })
//   let validation = schema.validate(req.query);
//   if(validation.error){
//     res.status(400).json({'error': 'Validation Error'})
//     return;
//   }
//
//   const db = fs.readFileSync('db/music.json', 'utf-8')
//   let data_base = JSON.parse(db)
//   let music = data_base.find((elem)=>{return elem.id === Number(req.query.music_id)});
//   if(!music){
//     res.status(404).json({'error': 'Index not found'})
//     return;
//   }
//
//   let dir = music.pictureFileDir;
//   res.status(200).download(dir);
// })

// authorisation: ALL
router.get('/stream', function (req,res, next){
  const schema = Joi.object({
    music_id: Joi.number().required(),
  })
  const validation = schema.validate(req.query);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }

  const db = fs.readFileSync('db/music.json', 'utf-8')
  let data_base = JSON.parse(db)
  let index = data_base.findIndex((elem)=>{return elem.id === Number(req.query.music_id)});
  if(index<0){
    res.status(404).json({'error': 'Index not found'})
    return;
  }
  let music_dir = data_base[index].musicFileDir;
  let readStream = fs.createReadStream(music_dir);
  readStream.pipe(res);
  res.status(200);
})

// authorisation: LOGGED
router.get('/favourite/', function (req,res, next){
  const schema = Joi.object({
    id: Joi.number().required(),
  })
  const validation = schema.validate(req.query);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }
  const db = fs.readFileSync('db/user.json', 'utf-8')
  let data_base = JSON.parse(db)
  let account = data_base.find((elem)=>{return elem.id == req.query.id;});

  if(!account)
    res.status(404).send("Account not found")
  else if(account.favourite)
    res.status(200).send(account.favourite)
  else
    res.status(200).send([])
})

// autorisation: LOGGED
router.post('/favourite/', function (req,res, next){
  const schema = Joi.object({
    id: Joi.number().required(),
    music_id:  Joi.number().required(),
  })
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }
  const db = fs.readFileSync('db/user.json', 'utf-8')
  let data_base = JSON.parse(db)
  let account = data_base.find((elem)=>{return elem.id == req.body.id;});
  if(!account)
    res.status(404).json({'error': 'Account not found'})
  else{
    let fav = account.favourite;
    if(!fav) fav = [];
    fav.push(Number.parseInt(req.body.music_id));
    account.favourite = fav;
    let new_db = JSON.stringify(data_base)
    fs.writeFileSync('db/user.json', new_db, 'utf-8')
    res.status(200).json({'result': 'Data Added'})
  }
})

// authorisation: LOGGED
router.delete('/favourite/', function (req,res, next){
  const schema = Joi.object({
    id: Joi.number().required(),
    music_id:  Joi.number().required(),
  })
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).json({'error': 'Validation Error'})
    return;
  }
  const db = fs.readFileSync('db/user.json', 'utf-8')
  let data_base = JSON.parse(db)
  let account = data_base.find((elem)=>{return elem.id == req.body.id;});
  if(!account)
    res.status(404).json({'error': 'Account not found'})
  else{
    let fav = account.favourite;
    if(!fav) fav = [];

    let index = fav.findIndex((a)=>{return a===req.body.music_id});
    if(index <0){
      res.status(404).json({'error':'Index not found'});
      return;
    }
    fav.splice(index,1);

    account.favourite = fav;
    let new_db = JSON.stringify(data_base)
    fs.writeFileSync('db/user.json', new_db, 'utf-8')
    res.status(200).send({'result':'entry deleted'})
  }
})

module.exports = router;
