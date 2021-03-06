'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Client extends Model {

    static get hidden () {
        return ['user_id','created_at','updated_at']
    }

    jobs () {
        return this.hasMany('App/Models/Job')
    }

    contracts () {
        return this.hasMany('App/Models/Contract')
    }

    user () {
        return this.belongsTo('App/Models/User')
    }
}

module.exports = Client
