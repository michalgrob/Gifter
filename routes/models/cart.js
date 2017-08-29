/**
 * Created by michal on 11/08/2017.
 */
var Gift = require('./Gift');

module.exports = function Cart (oldCart) {

    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.remove = function (item,id) {
        var storedItem = this.items[id];
        this.totalPrice -= storedItem.item.price;
        storedItem.qty--;
        storedItem.price = storedItem.item.price * storedItem.qty;
        this.totalQty--;
        this.totalPrice += storedItem.item.price;
    };

    this.add = function (item, id) {
        var storedItem = this.items[id];
        if(!storedItem){
            storedItem = this.items[id] = {item: item, qty:0, price: 0};
        }
        storedItem.qty++;
        storedItem.price = storedItem.item.price * storedItem.qty;
       // storedItem.ImageUrl =
        this.totalQty++;
        this.totalPrice += storedItem.item.price;
    };

    this.generateArray = function(){
        var arr = [];
        for(var id in this.items){
            arr.push(this.items[id]);
        }
        return arr;
    };

    this.generateGiftIdToCart = function(giftId){
        Gift.findById(giftsId,function (err,gift) {
            this.add(gift,giftsId);
        })

    };


};
