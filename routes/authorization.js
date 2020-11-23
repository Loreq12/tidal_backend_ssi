let fs = require('fs')

function authorize(account_id, required_auths){
    const db = fs.readFileSync('db/user.json', 'utf-8')
    let data_base = JSON.parse(db)
    let account = data_base.find((elem)=>{return elem.id === Number(account_id);});
    if(!account) return false;

    let acces_granted = false;
    required_auths.forEach((auth)=>{
        acces_granted |= (account.access === auth);
    })

    return acces_granted;
}

module.exports = {authorize}