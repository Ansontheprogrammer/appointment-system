import { Database } from './database'

// export function updateCustomerAccount(req, res, next){
//     /**
//      * @req body = {
//      *  phoneNumber: string,
//      *  prop: "email" | "firstName" | "lastName" | "deals" | "alert" | "zipCode" | "stepNumber",
//      *  value: string
//      * }
//      */
//     const { phoneNumber, prop, value } = req.body;
    
//     new Database().updateCustomer(phoneNumber, prop, value).then(() => {
//         res.sendStatus(200)
//     }, next)
// }

// export function getCustomerAccount(req, res, next){
//     /**
//      * @req body = {
//      *  phoneNumber: string
//      * }
//      */
//     new Database().findCustomerInDatabase(req.body.phoneNumber).then(customer => {
//         res.json(customer)
//     }, next)
// }

// export function createDeal(req, res, next) {
//     /**
//      * @req body = {
//      *  title: string;
//         body: string;
//         category: string;
//         companyName: string;
//         originalPrice: string;
//         dealPrice: string;
//         daysAvailable: string[];
//         timeOfDay: "breakfast" | "lunch" | "dinner";
//     * }
//      */
//     new Database().storeDeal(req.body).then(() => {
//         res.sendStatus(200)
//     }, next)
// }
