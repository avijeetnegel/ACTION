namespace learning;
// using { Northwind } from '../srv/external/Northwind';

entity Cust {
    key ID       : Integer;
    Name         : String(100);
    Email        : String(100);
    City         : String(50);
    Country      : String(50);
}