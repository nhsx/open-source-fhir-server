var CryptoJS = require('crypto-js');

var crypto = {
    key:'9H?RB=8srH?MyePwdzK&',//TODO: ENTER YOUR OWN SUPER TOP SECRET KEY HERE...
    encrypt:function(plainText) {
        return CryptoJS.AES.encrypt(plainText,this.key).toString();
    },
    decrypt:function(cipherText) {
        var bytes = CryptoJS.AES.decrypt(cipherText,this.key);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}

module.exports = {
    crypto
}