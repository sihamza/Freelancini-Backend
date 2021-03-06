'use strict'
const { validate , formatters } = use('Validator')
const User = use('App/Models/User')
const Freelancer = use('App/Models/Freelancer')
const Client = use('App/Models/Client')
const Country = use('App/Models/Country')
const Address = use('App/Models/Address')
const Language = use('App/Models/Language')
const Helpers = use('Helpers')
const Contract = use('App/Models/Contract')

class UserController {

  async signup ({ request , response }) {
    const validation = await validate(request.all(), {
      email: 'required|email',
      firstname: 'required',
      username: 'required',
      lastname: 'required',
      password: 'required',
      street: 'required',
      city : 'required',
      country : 'required',
      //picture : 'required',
     }
     , formatters.JsonApi )

    if (!validation.fails()) {

      const profilePic = request.file('picture')

      const user = new User()
      const name = Date.now() + '.jpg'
      const path = Helpers.publicPath() + '/uploads/'

      await profilePic.move( path , {
        name: name ,
        overwrite: true
      })

      user.fill(request.only(['email','username','lastname','firstname', 'password']))
      user.picture = '/uploads/' + name
      const domain = request.input('domain') ? request.input('domain') : ""
      user.domain = domain.toString()
      user.skills = ""
      await user.client().save(new Client())
      const address = new Address() 
      address.fill(request.only(['street','city']))
      address.country().associate(await Country.find(request.input('country')))
      await user.address().save(address)
      await user.freelance().save(new Freelancer())
      return { code : 200 , mesaage : "dsffsdfsdf" }
     }
    else {
      return { error : { code : 400 , message: validation.messages()[0]['message'] }}
    }
  }

  async login ({ request , response , auth }) {
    const validation = await validate(request.all(),{ email: 'required|email' , password: 'required' })
    if (!validation.fails()) {
      const token = await auth.attempt(request.input('email'),request.input('password'))
      const user = await User.findBy({ email : request.input('email') })
      token.role = user.role
      return  token

    } else {
      return { error : { code : 400 , message: validation.messages()[0]['message'] }}
    }
  }

  async getToken({ request, auth }) {
    return await auth.listTokens()
  }

  async logout ({ request , response , auth }) {
    const user = await auth.getUser()
    return await auth.authenticator('jwt').revokeTokens('')
  }

  async informations ({ request, response , auth }) {
    //return await auth.getUser()
    const user = await auth.getUser() 
    const informations = await User.query().where('id', '=', user.id ).with('address.country').fetch()
    return informations 
    //return await user.informations()
  }

  async update ({ request, response , auth }) {
    try
     { const user = await auth.getUser()

      user.merge(request.only(['email','lastname','firstname','domain','skills','lang','about']))


      const address = await user.address().fetch() 

      await user.address().update({ street : request.input('street') , city : request.input('city')  , country_id : request.input('country') })
      


      await user.save()

      return { code : 200 , mesaage : "dsffsdfsdf" , user : user }
    } catch(error) {

      return   { code : 500 , mesaage : "ghgh" }
    }
     

  }

  async updatePicture ({ request , auth }) {
    try {
        const user = await auth.getUser()
        const profilePic = request.file('picture', {
            types: ['image'],
            size: '2mb'
        })
        const name = Date.now() + '.jpg'
        const path = Helpers.publicPath() + '/uploads/'

        await profilePic.move( path , {
            name: name ,
            overwrite: true
        })
        user.picture = '/uploads/' + name
        await user.save()
        return { code : 200 , message : " updated !! " , image : user.picture }
    } catch (error) {
        return { code : 500 , message : " error !! "}
    }
    
  }

  async destroy ({ request, response , auth }) {
    const user = await auth.getUser()
    user.delete()
  }

  async addLanguge ({ request, response , auth }) {
    const user = await auth.getUser()
    const language = new Language()
    language.fill(request.only(['name','level','type']))
    user.languages().save(language)
  }

  async deleteLanguge ({ request, response , auth  , params }) {
    const user = await auth.getUser()
    await user.languages().where('id',params.id).delete()
  }

  async addSkill ({ request, response , auth }) {
    const user = await auth.getUser()
    user.delete()
  }

  async switchRole ({ request, response , auth }) {
    const user = await auth.getUser()
    user.role = !user.role
    await user.save()
    response.json({ code : 200 , message: `role switched to ${ user.role ? 'client' : 'freelancer' }` , role : user.role })
  }

  async contracts ({ auth }) {
    const user = await auth.getUser()
    return await User.query().where('id','=',user.id).with('freelance.contracts.job.client.user').fetch()
  }

 async acceptedContracts ({ auth }) {
   const user = await auth.getUser()
   const freelancer = await user.freelance().fetch()
   return await Contract.query().where('freelancer_id','=',user.id).andWhere('status',true).with('job.client.user').fetch()
}


}

module.exports = UserController
