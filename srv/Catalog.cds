using Northwind from './external/Northwind';
using { learning } from '../db/schema';

service Learning {

 function getUserInfo()
    returns {
      name     : String;
      isVendor : Boolean;
      isBuyer  : Boolean;
      scopes   : array of String;
    };

entity Custm as projection on learning.Cust;
function getCust() returns array of Custm;

entity Orders as projection on Northwind.Orders;
entity Customers as projection on Northwind.Customers;

entity OrderDtls as projection on Northwind.Order_Details;

function Ctomer1() returns array of Customers;

function getCount1() returns Integer ;
function OrderItem() returns array of OrderDtls;
function checkExpand() returns array of { CustomerID : String; CompanyName : String; Orders: array of { OrderID : Integer } };
// Build "Sales Order Validation Service"
action validateSalesOrder(OrderID : Integer) returns {
                        status : String;
                        customer : String;
                        CustomerName : String;
                        totalAmount : Decimal;
                        approvalRequired : Boolean;
                        };
    // "Top Customers Dashboard"
    function getTopCustomer() returns array of { CustomerName : String; TotalPurchaseValue : Decimal ; TotalOrders: Integer };
    // Unbound Function
    function unbfunc( id: Integer ) returns { id : Integer ; name : String };
    function unbfunc1( id: Integer ) returns array of String;
    function unbfunc2( id: Integer , buyerId :String ) returns array of { id : Integer ; name : String };
     // Unbound Action
    action unbact( id: Integer ) returns { id : Integer ; name : String };
    action unbact1( id: Integer ) returns array of String; 
    action unbact2( id: Integer , buyerId :String ) returns array of { id : Integer ; name : String };
}