const cds = require('@sap/cds');
const { URL } = require('url');

module.exports = cds.service.impl(async function() {
  // get data from onpremise system from northwind service and return to consumer
  // Build "Sales Order Validation Service"

  const Northwind = await cds.connect.to("Northwind");

  const { Orders, Custm , Customers , Dummy , OrderDtls } = this.entities;

  this.on('getCust', async (req) => {
    const tx = cds.tx(req);
    const data =  await tx.run(SELECT.from(Custm));
    debugger;
    return data;
  });

  this.on('getUserInfo', async (req) => {
    // In real scenario, you will get user info from JWT token or session

    return {
    id: req.user.id,
    isVendor: req.user.is('Vendor'),
    isBuyer: req.user.is('Buyer'),
    scopes: "Avijeet is learning CAP"
    };
  });
  //  this.on('READ',Custm,async(req)=>{
  //   console.log("Handler triggered");
  //       const tx = cds.tx(req);
  //   const data =  await tx.run(SELECT.from(Custm));
  //   debugger;
  //   return data
  // })
  
  this.on("getCount1", async (req) => {
    // const count = await Northwind.run(
    //   SELECT.one.from(OrderDtls).columns`count(*) as count`,
    // );
     const count = await Northwind.send({
      method: "GET",  
      path: "/Order_Details/$count",
    })
    console.log("Count is ", count);
    return count; // IMPORTANT
  }),

    this.on("READ", OrderDtls, async (req) => {
      let results = [];
      let url = "/Order_Details";

      const serviceRoot =
        "https://services.odata.org/V2/Northwind/Northwind.svc";

      while (url) {
        const response = await Northwind.send({
          method: "GET",
          path: url,
        });

        // ✅ Handle data correctly
        if (response.value) {
          results.push(...response.value);
        } else {
          // fallback (rare CAP behavior)
          results.push(...response);
        }

        // ✅ Handle nextLink (OData V2 + V4 safe)
        let nextLink = response["$next"] || response["@odata.nextLink"];

        if (!nextLink) break;

        // ✅ Convert absolute URL → relative path
        if (nextLink.startsWith("http")) {
          nextLink = nextLink.replace(serviceRoot, "");
        }

        url = nextLink;
      }

      console.log("Total Count:", results.length);
      return results;
    });


  this.on('READ',Customers,async(req)=>{
    return await Northwind.run(req.query);
  })
  this.on("READ", Orders, async (req) => {
    const res = await Northwind.send({
      method: "GET",
      path: "/Orders",
    });
    return {
      value: res.value,
      nextLink: res["@odata.nextLink"],
    };
  });

  // this.on('READ',Customers,async(req)=>{
  //     returnk Northwind.run(req.query);
  // });
    
  this.on('OrderItem',async(req)=>{
    // return await Northwind.run(SELECT.from(OrderDtls));
    return aOrderItems1 = await Northwind.send({
      method: "GET",
      path: `/Order_Details`,
    })
  });

  this.on('Order1',async(req)=>{
    // return await Northwind.run(SELECT.from(OrderDtls));
    return aOrderItems1 = await Northwind.send({
      method: "GET",
      path: `/Order`,
    })
  });

  this.on('Ctomer1',async(req)=>{
    return await Northwind.run(SELECT.from(OrderDtls));
    // const resGet =   await Northwind.send({
    //   method: "GET",
    //   path: `/Customers`,
    // })
    // return resGet;
    debugger;
    // const  Cust = await Northwind.run(SELECT.from(Customers));
    // const resGet = await Northwind.get('/Customers?$expand=Orders');
    // const sendd = await Northwind.send({
    //   method: "GET",
    //   path: `/Customers`,
    // })
    // debugger;
    // return sendd;
    
  });

  this.on("validateSalesOrder", async (req) => {
    const OrderID = req.data.OrderID;
    // Call onpremise system and get data

    const aOrder = await Northwind.run(
      SELECT.from(Order).where({ OrderID: OrderID }),
    );
    

    const aOrderItems = await Northwind.run(
      SELECT.from("Order_Details")
        .columns("OrderID", "UnitPrice", "Quantity")
        .where({ OrderID: OrderID }),
    );
    const totalAmt = aOrderItems.reduce((sum, item) => {
      sum = sum + item.Quantity * item.UnitPrice;
      return sum;
    }, 0);

    const customerId = aOrder[0].CustomerID;
    const customerData = await Northwind.run(
      SELECT.from(Customers).where({ CustomerID: customerId }),
    );

    return {
      OrderID: OrderID,
      status: totalAmt > 1000 ? "Approval Required" : "Approved",
      customer: customerId,
      CustomerName: customerData[0].ContactName,
      totalAmount: totalAmt,
      approvalRequired: aOrder[0].ApprovalRequired,
    };
  });

  this.on("getTopCustomer", async (req) => {
    // const resCustomer = await Northwind.run(SELECT.from(Customers));
    const customers = await fetchAll(Northwind, "Customers"); 
    debugger;
  });

  this.on("checkExpand", async (req) => {
    const resNormal = await Northwind.run(SELECT.from(Customers));
    const resWay1 = await Northwind.run(
      SELECT.from(Customers, c=>{
        c('*')
        c.Orders(o=>{
            o('*')
        })
        })
    );
    debugger;
    const resWay2 = await Northwind.run(
        SELECT.from(Customers).columns( oItem => [
            oItem `*`,
            oItem.Orders(oOrd => oOrd`*`)])
        
    )

    const resGet = await Northwind.get('/Customers?$expand=Orders')

    const try1 = await Northwind.run(
    SELECT.from(Customers).columns( c => [
        c`*`, 
        c.Orders( o => [ 
                    o`*` , 
                    o.Order_Details( od => od`*` ) 
                       ] 
               ),
        c.CustomerDemographics(cd => cd`*`)       
    ]));

    const try2= await Northwind.run(
    SELECT.from(Customers).columns( c => [
        c.CustomerID ,
        c.ContactName,
        c.Orders( o => [ 
                    o.OrderID , o.ShipName, o.ShipCity, o.ShipCountry, 
                    o.Order_Details( od => od`*` ) 
                       ] 
               ),
        c.CustomerDemographics(cd => cd`*`)       
    ]));
   
  });

  async function fetchAll(remote, entity) {
    let url = `/${entity}`;
    let all = [];

    while (url) {
      const res = await remote.get(url);

      // OData V2 format: .value OR direct array
      const rows = res.value || res;

      all.push(...rows);

      let next = res["@odata.nextLink"] || res.__next || res.$next;

      if (!next) break;

      // ✅ IMPORTANT FIX: convert absolute → relative
      // url = new URL(next).pathname + new URL(next).search
      const parsed = new URL(next);
      // full path from host root
      url = parsed.pathname + parsed.search;

      // strip service-root prefix
      const serviceRoot = "/V2/Northwind/Northwind.svc";

      if (url.startsWith(serviceRoot)) {
        url = url.substring(serviceRoot.length);
      }
    }

    return all;
  }

  //Adding some unbound functions and actions
  this.on("unbfunc", async (req) => {
    const id = req.data.id;
    return {
      id: id,
      name: `Name of ${req.data.user} is Avijeet`,
    };
  });

  this.on("unbfunc1", async (req) => {
    const id = req.data.id;
    return [
      `Name of ${req.data.user} is Avijeet`,
      `Name of ${req.data.user} is Avijeet2`,
    ];
  });
  this.on("unbfunc2", async (req) => {
    const id = req.data.id;
    const buyerId = req.data.buyerId;
    return [
      {
        id: id,
        name: `Name of ${buyerId} is Avijeet`,
      },
      {
        id: id,
        name: `Name of ${buyerId} is Avijeet2`,
      },
    ];
  });

  this.on("unbact", async (req) => {
    const id = req.data.id;
    return {
      id: id,
      name: `Name of ${req.data.user} is Avijeet`,
    };
  });

  this.on("unbact1", async (req) => {
    const id = req.data.id;
    return [
      `Name of ${req.data.user} is Avijeet`,
      `Name of ${req.data.user} is Avijeet2`,
    ];
  });
  this.on("unbact2", async (req) => {
    const id = req.data.id;
    const buyerId = req.data.buyerId;
    return [
      {
        id: id,
        name: `Name of ${buyerId} is Avijeet`,
      },
      {
        id: id,
        name: `Name of ${buyerId} is Avijeet2`,
      },
    ];
  });
})