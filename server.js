const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server");
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let orderBook = {
  buy: [
    { availqty: 5, bidprice: 500000 },
    { availqty: 7, bidprice: 400000 },
    { availqty: 17, bidprice: 350000 },
    { availqty: 4, bidprice: 300000 },
    { availqty: 10, bidprice: 270000 },
    { availqty: 40, bidprice: 260000 },
    { availqty: 100, bidprice: 250000 },
    { availqty: 100, bidprice: 240000 },
    { availqty: 100, bidprice: 230000 },
    { availqty: 100, bidprice: 220000 },
    { availqty: 100, bidprice: 210000 },
    { availqty: 100, bidprice: 200000 },
  ],
  sell: [
    { availqty: 3.3, askprice: 600000 },
    { availqty: 5.7, askprice: 700000 },
    { availqty: 7, askprice: 750000 },
    { availqty: 20, askprice: 800000 },
    { availqty: 20, askprice: 850000 },
    { availqty: 30, askprice: 900000 },
    { availqty: 30, askprice: 950000 },
    { availqty: 100, askprice: 960000 },
    { availqty: 100, askprice: 970000 },
    { availqty: 100, askprice: 980000 },
    { availqty: 100, askprice: 990000 },
  ],
};

const sortBuyOrdersDescending = () => {
  orderBook.buy.sort((a, b) => b.bidprice - a.bidprice);
};

const sortSellOrdersAscending = () => {
  orderBook.sell.sort((a, b) => a.askprice - b.askprice);
};

const processOrder = (data) => {
  let { type, qty, price } = data;
  if (type === "buy") {
    for (let i = 0; i < orderBook.sell.length; i++) {
      let sellOrder = orderBook.sell[i];
      if (sellOrder.askprice <= price) {
        if (qty === sellOrder.availqty) {
          orderBook.sell.splice(i, 1);
          sortSellOrdersAscending();
          return;
        } else if (qty < sellOrder.availqty) {
          sellOrder.availqty -= qty;
          sortSellOrdersAscending();
          return;
        } else {
          qty -= sellOrder.availqty;
          orderBook.sell.splice(i, 1);
          i--;
        }
      }
    }
    if (qty > 0) {
      let existingOrder = orderBook.buy.find(
        (order) => order.bidprice === price
      );
      if (existingOrder) {
        existingOrder.availqty += qty;
      } else {
        if (qty > 0) {
          orderBook.buy.push({ availqty: qty, bidprice: price });
        }
      }
      sortBuyOrdersDescending();
    }
  } else if (type === "sell") {
    for (let i = 0; i < orderBook.buy.length; i++) {
      let buyOrder = orderBook.buy[i];
      if (buyOrder.bidprice >= price) {
        if (qty === buyOrder.availqty) {
          orderBook.buy.splice(i, 1);
          sortBuyOrdersDescending();
          return;
        } else if (qty < buyOrder.availqty) {
          buyOrder.availqty -= qty;
          sortBuyOrdersDescending();
          return;
        } else {
          qty -= buyOrder.availqty;
          orderBook.buy.splice(i, 1);
          i--;
        }
      }
    }
    if (qty > 0) {
      let existingOrder = orderBook.sell.find(
        (order) => order.askprice === price
      );
      if (existingOrder) {
        existingOrder.availqty += qty;
      } else {
        if (qty > 0) {
          orderBook.sell.push({ availqty: qty, askprice: price });
        }
      }
      sortSellOrdersAscending();
    }
  }
};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("initialOrderBook", orderBook);

  socket.on("processOrder", (data, callback) => {
    processOrder(data)
    io.emit("updateOrderBook", orderBook);

    const responseData = {
      message: "Order processed successfully",
    };
    callback(responseData);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(3333, () => {
  console.log(`Socket.IO server is running on http://localhost:3333`);
});
