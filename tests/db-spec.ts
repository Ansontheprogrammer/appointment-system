import 'mocha';
import * as assert from 'assert';
import { Database, BARBER } from '../lib/database';
import sinon from 'sinon';

describe('Database class', () => {
    // const database = new Database();
    
    // let sandbox;

    // beforeEach(() => {
    //     // stub out all database functions
    //     sandbox = sinon.createSandbox()
    // })

    // afterEach(() => {
    //     // restore all mongo db functions
    //     sandbox.restore();
    // })

    // describe('firstLetterUpperCase', () => {
    //     it('it should change letter to upperCase', () => {
    //         const name = Database.firstLetterUpperCase('anson')
    //         assert.equal(name, 'Anson');
    //     })
    // })

    // describe('findBarberInDatabase', () => {
    //     it('it should find barber in mongo db', done => {
    //         const expectedBarber: BARBER = {
    //             phoneNumber: '9082097544',
    //             email: 'ansonervin@gmail.com',
    //             firstName: 'Anson',
    //             lastName: 'Ervin',
    //             zipCode: '07083',
    //             appointments: [
    //                 {
    //                     customer: {
    //                         phoneNumber: '9082097544',
    //                         firstName: 'Idris',
    //                         stepNumber: '1'
    //                     },
    //                     time: '5pm - 6pm'
    //                 }
    //             ]
    //         };

    //         sandbox.stub({}, 'findOne')
    //         .withArgs({ phoneNumber: '9082097544' })
    //         .yields(null, expectedBarber)
            
    //         database.findBarberInDatabase('9082097544').then(barber => {
    //             // convert user variable to object
    //             assert.deepEqual(barber, expectedBarber);
    //             done()
    //         }, done);
    //     })
    // })
    // const deals = [ 
    //     { daysAvailable: [ 'Monday' ],
    //         _id: '5ce2e5288986ad6ae939f8ed',
    //         title: 'Two Meats. Two sides. One',
    //         body:
    //         'Grilled Shrimp Skewer & Grilled Chicken Breast (Limited Time Only @$12.99)',
    //         category: 'American',
    //         companyName: 'Apple Bees',
    //         originalPrice: '17.99',
    //         dealPrice: '12.99',
    //         timeOfDay: 'dinner',
    //         __v: 0 },
    //     { daysAvailable:
    //         [ 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday' ],
    //         _id: '5ce435a91c9d4400000178b1',
    //         title: 'Lunch Specials',
    //         body: 'Rusty vegan chilli. Veggie soup bowl with spices ',
    //         category: 'American',
    //         companyName: 'Jules\' Bistro',
    //         timeOfDay: 'lunch',
    //         dealPrice: 'Bowl - $6.00',
    //         imageUrl:
    //         'https://res.cloudinary.com/dhgnvzmi3/image/upload/v1558460382/Jules%20Bistro.png',
    //         __v: 0 
    //     },
    //     { daysAvailable: [ 'Monday, Tuesday, Wednesday, Thursday, Friday' ],
    //         _id: '5ce4380a1c9d4400000178b2',
    //         companyName: 'Kay\'s Midtown Cafe & Catering ',
    //         category: 'American',
    //         title: 'Weekday Special\t',
    //         body: '$9.99 Weekday Lunch Buffet (drink included, coffee or pop)',
    //         timeOfDay: 'lunch',
    //         dealPrice: '9.99',
    //         imageUrl:
    //         'https://res.cloudinary.com/dhgnvzmi3/image/upload/v1558460741/Kay%27s%20Cafe.jpg',
    //         __v: 0 },
    //     { daysAvailable: [ 'Monday' ],
    //         _id: '5ce898734bffeb7663f1174c',
    //         title: 'Two Meats. Two sides. One',
    //         body:
    //         'Grilled Shrimp Skewer & Grilled Chicken Breast (Limited Time Only @$12.99)f',
    //         category: 'American',
    //         companyName: 'Apple Bees',
    //         originalPrice: '17.99',
    //         dealPrice: '12.99',
    //         timeOfDay: 'dinner',
    //         __v: 0 } 
    // ]

    // let customer: CUSTOMER_WITH_ID = { 
    //     _id: '5ca16e56b9c30055fc1e7bff',
    //     phoneNumber: '9082097544',
    //     email: 'ansonervin@gmail.com',
    //     firstName: 'anson',
    //     lastName: 'ervin',
    //     zipCode: '09767',
    //     __v: 30,
    //     stepNumber: '2'
    // }

    // const customersDBConnect: Database = new Database()

    // describe('findCustomerInDatabase', () => {
    //     it('should be able to find a customer because it exists', done => {
    //         BarberModel
    //         .findOne
    //         .withArgs({ phoneNumber: '9082097544' })
    //         .yields(null, customer)
            
    //         customersDBConnect.findCustomerInDatabase('9082097544').then(user => {
    //             // convert user variable to object
    //             assert.deepEqual(user, customer)
    //             done()
    //         }, done);
    //     })

    //     it('should not be able to find nonexistent records', done => {

    //         BarberModel
    //         .findOne
    //         .withArgs({ phoneNumber: '9089302934' })
    //         .yields({ statusCode: 404 }, null)

    //         customersDBConnect.findCustomerInDatabase('9089302934').then(userFound => {
    //             // throw error because user is found
    //             assert.ifError(userFound);
    //             done()
    //         }, err => {     
    //             assert.equal(err.statusCode, 404, 'should not be able to find user')           
    //             done()
    //         });
    //     })
    // })

    // describe('findDealsByCategory', () => {
    //     it('should be able to return 1 deal', done => {  
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals[0])
   
    //         customersDBConnect.findDealsByCategory('american', 1).then(user => {
    //             assert.deepEqual(user, deals[0])
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 2 deals', done => {    
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals.slice(0, 1)) 

    //         customersDBConnect.findDealsByCategory('american', 2).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 1))
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 3 deals', done => {     
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals.slice(0, 2)) 

    //         customersDBConnect.findDealsByCategory('american', 2).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 2))
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 4 deals', done => {     
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals.slice(0, 3)) 

    //         customersDBConnect.findDealsByCategory('american', 3).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 3))
    //             done()
    //         }, done);
    //     })

    //     it(`should not be able to find deals because category doesn't exist`, done => {
    //         DealModel
    //         .find
    //         .withArgs({ category: '1234' })
    //         .yields('This is not a valid category', null) 

    //         customersDBConnect.findDealsByCategory('1234', 20).then(user => {
    //         }, err => { // convert user variable to object
    //             assert.equal(err, 'This is not a valid category')
    //             done()
    //         })
    //     })
    // })

    // describe('findDealsByCategory', () => {
    //     it('should be able to return 1 deal', done => {  
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals[0])
   
    //         customersDBConnect.findDealsByCategory('american', 1).then(user => {
    //             assert.deepEqual(user, deals[0])
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 2 deals', done => {    
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals.slice(0, 1)) 

    //         customersDBConnect.findDealsByCategory('american', 2).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 1))
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 3 deals', done => {     
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals.slice(0, 2)) 

    //         customersDBConnect.findDealsByCategory('american', 2).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 2))
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 4 deals', done => {     
    //         DealModel
    //         .find
    //         .withArgs({ category: 'American' })
    //         .yields(null, deals.slice(0, 3)) 

    //         customersDBConnect.findDealsByCategory('american', 3).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 3))
    //             done()
    //         }, done);
    //     })

    //     it(`should not be able to find deals because category doesn't exist`, done => {
    //         DealModel
    //         .find
    //         .withArgs({ category: '1234' })
    //         .yields('This is not a valid category', null) 

    //         customersDBConnect.findDealsByCategory('1234', 20).then(user => {
    //         }, err => { // convert user variable to object
    //             assert.equal(err, 'This is not a valid category')
    //             done()
    //         })
    //     })
    // })

    // describe('findAllDeals', () => {
    //     it('should be able to return 2 deal', done => {  
    //         DealModel
    //         .find
    //         .yields(null, deals.slice(0,1))
   
    //         customersDBConnect.findAllDeals(2).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 1))
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 3 deals', done => {    
    //         DealModel
    //         .find
    //         .yields(null, deals.slice(0, 2)) 

    //         customersDBConnect.findAllDeals(3).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 2))
    //             done()
    //         }, done);
    //     })

    //     it('should be able to return 4 deals', done => {     
    //         DealModel
    //         .find
    //         .yields(null, deals.slice(0, 3)) 

    //         customersDBConnect.findAllDeals(4).then(user => {
    //             assert.deepEqual(user, deals.slice(0, 3))
    //             done()
    //         }, done);
    //     })

    //     it(`should return an error if there are no deals currently in database`, done => {
    //         DealModel
    //         .find
    //         .yields('There are no deals in database', null) 

    //         customersDBConnect.findAllDeals(3).then(user => {
    //         }, err => { // convert user variable to object
    //             assert.equal(err, 'There are no deals in database')
    //             done()
    //         })
    //     })
    // })

    // describe('hasCustomerSignedUp', () => {
    //     it('should return customer is signed up', done => {
    //         BarberModel
    //         .findOne
    //         .withArgs({ phoneNumber: '9082097544' })
    //         .yields(null, customer)

    //         customersDBConnect.hasCustomerSignedUp('9082097544').then(isUserSignedUp => {
    //             assert.equal(isUserSignedUp, true)
    //             done()
    //         }, done)
    //     })

    //     it('should return customer is not signed up', done => {
    //         BarberModel
    //         .findOne
    //         .withArgs({ phoneNumber: '123456789' })
    //         .yields(null, null)

    //         customersDBConnect.hasCustomerSignedUp('123456789').then(isUserSignedUp => {
    //             assert.equal(isUserSignedUp, false)
    //             done()
    //         }, done)
    //     })
    // })

    // describe('createCustomer', () => {
    //     it.only('should return customer is signed up', done => {
    //         new BarberModel()
    //         .save
    //         .yields(null, customer)

    //         customersDBConnect.createCustomer(customer).then((createdCustomer: CUSTOMER_WITH_ID) => {
    //             // create customer 
    //             customersDBConnect.findCustomerInDatabase(createdCustomer.phoneNumber).then(customer => {
    //                 assert.deepEqual(createdCustomer, customer)
    //                 done()
    //             }, done)
    //         }, done)
    //     })
    // })

    // describe('storeDeal', () => {
    //     it('should return deal is created', done => {
    //         const sampleDealToCreate: TEXT_ALERT_DEAL_INFORMATION = { 
    //             title: 'Two Meats. Two sides. One',
    //             body: 'Grilled Shrimp Skewer & Grilled Chicken Breast (Limited Time Only @$12.99)f',
    //             category: 'American',
    //             companyName: 'Apple Bees',
    //             originalPrice: '17.99',
    //             dealPrice: '12.99',
    //             daysAvailable: ['Monday'],
    //             timeOfDay: 'dinner',
    //         }
    //         customersDBConnect.storeDeal(sampleDealToCreate).then((createdDeal: any) => {
    //             // create customer 
    //             customersDBConnect.findDeal({ title: sampleDealToCreate.title, category: sampleDealToCreate.category, companyName: sampleDealToCreate.companyName}).then(deal => {
    //                 // find recently created deal in database
    //                 // delete id so sample to create wilsl have same attributes
    //                 // adjust deal to object
    //                 deal = deal.toObject()
    //                 delete createdDeal._id 
    //                 delete deal._id
    //                 assert.deepEqual(JSON.stringify(createdDeal, null, 4), JSON.stringify(deal, null, 4))
    //                 done()
    //             }, done)
    //         }, done)
    //     })
    // })

    // describe('updateCustomer', () => {
    //     it('should update customer information', done => {
    //         const sampleUpdatedCustomer = { 
    //             deals: [ 'american', 'pizza' ],
    //             alertDays: [ '[\'monday\', \'tuesday\']' ],
    //             _id: '5ca16e56b9c30055fc1e7bff',
    //             phoneNumber: '9082097544',
    //             email: 'ansonervin@gmail.com',
    //             firstName: 'anson',
    //             lastName: 'ervin',
    //             zipCode: '09767',
    //             __v: 30,
    //             stepNumber: '2'
    //         }

    //         customersDBConnect.updateCustomer('9082097544', 'email', 'ansonervin@gmail.com').then((updatedCustomer: any) => {
    //             assert.deepEqual(JSON.stringify(updatedCustomer, null, 4), JSON.stringify(sampleUpdatedCustomer, null, 4))
    //             done()
    //         }, done)
    //     })
    // })
})