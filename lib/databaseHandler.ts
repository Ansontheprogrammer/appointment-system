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

export function createBarber(req, res, next) {
    /**
     * @req body = {
     * phoneNumber: string
        email: string
        firstName: string
        lastName: string
        zipCode: string
        appointments: [
            {
            customer: CUSTOMER
            time: string
            }
        ]
    * }
     */
    new Database().createBarber(req.body).then(() => {
        res.sendStatus(200)
    }, next)
}
