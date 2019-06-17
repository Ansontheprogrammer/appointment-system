import mongoose, { mongo } from 'mongoose';
import config from '../config/config'

const url = config.MONGO_CONNECTION_KEY;
process.env.GOOGLE_APPLICATION_CREDENTIALS = './config/credentials.json';

// connecting to mongo and creating schema
mongoose
.connect(url, { useNewUrlParser: true })
.then(()=> { console.log('connection to database successful') 
}, err => console.error(err))

// *******************SCHEMA DECLARATIONS***************************
const Schema = mongoose.Schema;

const barberSchema = new Schema( {
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    zipCode: { type: String, required: true },
    stepNumber: { type: String, required: true }
})

export const BarberModel = mongoose.model('customer', barberSchema)

export interface BARBER {
    phoneNumber: string,
    email: string, 
    firstName: string, 
    lastName: string,
    zipCode: string,
    stepNumber?: string
}


export class Database {
	public static firstLetterUpperCase(string){
		return string[0].toUpperCase() + string.slice(1)
	}

	public findBarberInDatabase(phoneNumber: string): Promise<mongoose.Document>{
		
		return new Promise((resolve, reject) => {
			BarberModel.findOne({ phoneNumber }, function(err, doc){
				if(err) return reject(err);
				if(!doc) return resolve(null);
				else return resolve(doc)
			})
		})
	}

	public findAllBarbers(): Promise<mongoose.Document>{
		
		return new Promise((resolve, reject) => {
			BarberModel.find({}, function(err, docs){
				if(err) return reject(err);
				if(!docs) return resolve(null);
				else return resolve(docs)
			})
		})
	}
	
	public updateBarber(phoneNumber: string, prop, value: string | number | string[]){
		// finish check to ensure stock list isn't already created.
		return new Promise((resolve, reject) => {
			this.findBarberInDatabase(phoneNumber).then(docs => {
				(docs as any)[prop] = value;
				docs.save(function(err, updatedDoc){
					if(err) reject(err);
					resolve(updatedDoc);
				})
			}, reject)
		})
	}
	
	public createBarber(customerInfo: BARBER){
		// Assign step number field before saving
		customerInfo = Object.assign(customerInfo, { stepNumber: '1' })
		customerInfo.firstName = Database.firstLetterUpperCase(customerInfo.firstName)
		customerInfo.lastName = Database.firstLetterUpperCase(customerInfo.lastName)
		customerInfo.email = customerInfo.email.toLowerCase();

		return new Promise((resolve, reject) => {
			this.hasBarberSignedUp(customerInfo.phoneNumber).then(hasBarberSignedUp => {
				if(hasBarberSignedUp) return reject('Customer has already signed up.')
				const customer = new BarberModel(customerInfo)
		
				// saving customer to database
				customer.save(function(err, updatedDoc){
					if(err) reject(err);
					resolve()
				})
			})
		})
    }
    
    public hasBarberSignedUp(phoneNumber: string): Promise<boolean>{

        return new Promise((resolve, reject) => {
            this.findBarberInDatabase(phoneNumber).then(user => {
                resolve(!!user);
            }, reject);
        })
    }
}
