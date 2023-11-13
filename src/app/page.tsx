"use client";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import io from "socket.io-client";
import Image from "next/image";
import moment from "moment";
import priceDb from "./priceDb";
import bitcoin from "../assets/bitcoin.png";
import { ApexOptions } from "apexcharts";
import dynamic from 'next/dynamic';
const DynamicApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

export default function Home() {
  const { state } = priceDb();
  const [range, setRange] = useState(0);
  const rangeOption = ["24 JAM", "1 MGG", "1 BLN", "1 THN", "SEMUA"];
  const denomOption = [100000, 500000, 1000000];
  const [buyNominal, setBuyNominal] = useState(0);
  const [buyTarget, setBuyTarget] = useState(0);
  const [sellTarget, setSellTarget] = useState(0);
  const [graphData, setGraphData] = useState<any>(state.series1);
  const [sellQty, setSellQty] = useState(0);
  const [socket, setSocket] = useState<any>(null);
  const [orderBook, setOrderBook] = useState<any>({});
  const [serverIp, setServerIp] = useState<any>("");
  const getGraphData = (index: any) => {
    switch (index) {
      case 1:
        setGraphData(state.series2);
        break;
      case 2:
        setGraphData(state.series3);
        break;
      case 3:
        setGraphData(state.series4);
        break;
      case 4:
        setGraphData(state.series5);
        break;
      default:
        setGraphData(state.series1);
        break;
    }
  };

  const getBTCBuyAmount = () =>
    buyNominal > 0 && buyTarget > 0
      ? parseFloat((buyNominal / buyTarget).toFixed(3))
      : 0;

  const getSellAmount = () =>
    sellQty > 0 && sellTarget > 0 ? sellQty * sellTarget : 0;

  const getBidData = () => {
    if (orderBook?.buy?.length < 10) {
      const emptyData = new Array(10 - orderBook?.buy?.length).fill({});
      const combinedData = orderBook?.buy?.concat(emptyData);
      return combinedData;
    } else {
      return orderBook?.buy?.slice(0, 10);
    }
  };
  const getAskingData = () => {
    if (orderBook?.sell?.length < 10) {
      const emptyData = new Array(10 - orderBook?.sell?.length).fill({});
      const combinedData = orderBook?.sell?.concat(emptyData);
      return combinedData;
    } else {
      return orderBook?.sell?.slice(0, 10);
    }
  };
  const isMobile = useMediaQuery({ query: `(max-width: 1023px)` });
  const processOrder = (type: any, qty: any, price: any) => {
    if (socket) {
      console.log("Calling processOrder function");
      socket.emit("processOrder", { type, qty, price }, (response: any) => {
        console.log("Emit callback:", response);
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setServerIp(window.location.hostname);
    }

    const newSocket = io(`http://${serverIp}:3333`);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to the Socket.IO server");

      newSocket.on("serverIp", (ip) => {
        setServerIp(ip);
      });

      newSocket.on("initialOrderBook", (data) => {
        setOrderBook(data);
      });

      newSocket.on("initialOrderBook", (data: any) => {
        setOrderBook(data);
      });

      newSocket.on("updateOrderBook", (data: any) => {
        setOrderBook(data);
      });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from the Socket.IO server");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <main className="">
      <div className={isMobile ? "p-8" : `p-24 pt-8`}>
        <p className="text-gray-500 text-sm lg:text-lg">
          Harga Crypto {">"} Harga Bitcoin
        </p>
        <div
          className={`flex mt-4 items-center ${isMobile ? "gap-2" : "gap-4"}`}
        >
          <Image
            src={bitcoin}
            alt="bitcoin logo"
            width={isMobile ? 32 : 48}
            height={isMobile ? 32 : 48}
          />
          <p className="font-bold text-xl lg:text-3xl">
            Harga Bitcoin Hari Ini
          </p>
        </div>
        <div className={`${isMobile ? "" : "flex"} gap-8`}>
          <div className="mt-8 basis-4/6">
            <div className="border-[1px] rounded-lg border-gray-300 pt-8">
              <p className={`text-gray-500 ml-8 text-xs lg:text-md`}>
                {moment().format("MMMM Do YYYY, HH:mm:ss")}
                <p className="font-extrabold text-black text-xl lg:text-3xl mt-1 mb-4">
                  Rp 573.620.661 {"   "}
                  <span className="text-sm lg:text-xl font-normal text-red-600">
                    -0.14%
                  </span>
                </p>
              </p>
              {typeof window !== "undefined" && (
                <Chart
                  options={state.options as ApexOptions}
                  series={graphData}
                  type="candlestick"
                  height={500}
                  width="100%"
                />
              )}

              <div className="lg:pl-8 lg:pr-8 pl-4 pr-4 mt-8 flex w-full gap-2 lg:gap-4">
                {rangeOption.map((item, index) => (
                  <p
                    onClick={() => {
                      setRange(index);
                      getGraphData(index);
                    }}
                    className={`basis-1/5 font-semibold text-xs lg:text-md text-center cursor-pointer ${
                      range === index && "bg-[#0C68F4] text-white"
                    } rounded-lg pt-2 pb-2`}
                  >
                    {item}
                  </p>
                ))}
              </div>
              <div className="mt-8 bg-gray-300 w-full h-[1px]" />
              <div className="flex p-4 lg:p-8 gap-x-2 lg:gap-x-4 gap-y-8 justify-center flex-wrap">
                <div className="basis-[30%]">
                  <p className="text-gray-500 text-xs lg:text-md">
                    Kapasitas Pasar
                  </p>
                  <p className="font-semibold text-sm lg:text-xl">
                    Rp 11.192 Triliun
                  </p>
                </div>
                <div className="basis-[30%]">
                  <p className="text-gray-500 text-xs lg:text-md">
                    Nilai Terdilusi Penuh
                  </p>
                  <p className="font-semibold text-sm lg:text-xl">
                    Rp 12.030 Triliun
                  </p>
                </div>
                <div className="basis-[30%]">
                  <p className="text-gray-500 text-xs lg:text-md">
                    Suplai yang Beredar
                  </p>
                  <p className="font-semibold text-sm lg:text-xl">
                    19.537.300 BTC
                  </p>
                </div>

                <div className="basis-[30%]">
                  <p className="text-gray-500 text-xs lg:text-md">
                    Suplai Maksimum
                  </p>
                  <p className="font-semibold text-sm lg:text-xl">
                    21.000.000 BTC
                  </p>
                </div>
                <div className="basis-[30%]">
                  <p className="text-gray-500 text-xs lg:text-md">
                    Volume Global (24 Jam)
                  </p>
                  <p className="font-semibold text-sm lg:text-xl">
                    Rp 380,38 Triliun
                  </p>
                </div>
                <div className="basis-[30%]">
                  <p className="text-gray-500 text-xs lg:text-md">
                    Total Nilai Terkunci
                  </p>
                  <p className="font-semibold text-sm lg:text-xl">
                    Rp 37,14 Miliar
                  </p>
                </div>
              </div>
            </div>

            <p className="font-semibold text-md lg:text-xl mt-8">
              <span className="text-lg lg:text-3xl">Order Book -</span> BTC/IDR
            </p>
            <div className="flex gap-4">
              <div className="border-[1px] basis-2/4 rounded-lg border-gray-300 mt-8 p-4 lg:p-8">
                <p className="font-semibold text-md lg:text-lg">Order Beli</p>
                <div className="flex gap-2 mt-4">
                  <p className="font-semibold text-xs text-gray-400 lg:text-lg basis-[48%]">
                    Qty
                  </p>
                  <p className="font-semibold text-xs text-gray-400 lg:text-lg basis-[48%]">
                    Bid Price
                  </p>
                </div>
                {getBidData()?.map((item: any) => (
                  <div className="flex gap-2 mt-2 pb-2 min-h-[32px] border-b-[1px] border-gray-300">
                    <p className="font-semibold text-xs text-green-600 lg:text-lg basis-[48%]">
                      {item?.availqty % 1 !== 0
                        ? item?.availqty?.toFixed(2)
                        : item?.availqty}
                    </p>
                    <p className="font-semibold text-xs lg:text-lg basis-[48%]">
                      {item?.bidprice && (
                        <>
                          {isMobile
                            ? `${item?.bidprice
                                .toLocaleString()
                                .replace(/,/g, ".")}`
                            : `Rp ${item?.bidprice
                                .toLocaleString()
                                .replace(/,/g, ".")}`}
                        </>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-[1px] basis-2/4 rounded-lg border-gray-300 mt-8 p-4 lg:p-8">
                <p className="font-semibold text-sm lg:text-lg">Order Jual</p>
                <div className="flex gap-2 mt-4">
                  <p className="font-semibold text-xs text-gray-400 lg:text-lg basis-[48%]">
                    Qty
                  </p>
                  <p className="font-semibold text-xs text-gray-400 lg:text-lg basis-[48%]">
                    Asking Price
                  </p>
                </div>
                {getAskingData()?.map((item: any) => (
                  <div className="flex gap-2 mt-2 pb-2 min-h-[32px] border-b-[1px] border-gray-300">
                    <p className="font-semibold text-xs text-red-600 lg:text-lg basis-[48%]">
                      {item?.availqty % 1 !== 0
                        ? item?.availqty?.toFixed(2)
                        : item?.availqty}
                    </p>
                    <p className="font-semibold text-xs lg:text-lg basis-[48%]">
                      {item?.askprice && (
                        <>
                          {isMobile
                            ? `${item?.askprice
                                .toLocaleString()
                                .replace(/,/g, ".")}`
                            : `Rp ${item?.askprice
                                .toLocaleString()
                                .replace(/,/g, ".")}`}
                        </>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="basis-2/6">
            <div className="mt-8 border-[1px] rounded-lg border-gray-300 p-8">
              <p className="font-semibold text-md lg:text-xl">
                Beli Bitcoin Mulai dari Rp 11.000!
              </p>
              <p className="text-gray-500 text-xs lg:text-md mt-8">
                Masukkan jumlah pembelian:
              </p>
              <input
                className="w-full border-0 outline-none font-semibold text-xl lg:text-3xl bg-transparent mt-2 pb-2 border-b-2 border-gray-400"
                type="text"
                value={"Rp " + buyNominal.toLocaleString().replace(/,/g, ".")}
                onChange={(e) => {
                  setBuyNominal(Number(e.target.value.replace(/[^0-9]/g, "")));
                }}
              />
              <div className="flex gap-4 w-full mt-4">
                {denomOption.map((item) => (
                  <p
                    onClick={() => setBuyNominal(item)}
                    className={`basis-2/6 font-semibold text-center cursor-pointer text-xs lg:text-sm bg-gray-200 text-black rounded-lg pt-2 pb-2`}
                  >
                    {item.toLocaleString().replace(/,/g, ".")}
                  </p>
                ))}
              </div>

              <p className="text-gray-500 text-xs lg:text-md mt-8">
                Masukkan harga beli per-coin:
              </p>
              <input
                className="w-full border-0 outline-none font-semibold text-xl lg:text-3xl bg-transparent mt-2 pb-2 border-b-2 border-gray-400"
                type="text"
                value={"Rp " + buyTarget.toLocaleString().replace(/,/g, ".")}
                onChange={(e) => {
                  setBuyTarget(Number(e.target.value.replace(/[^0-9]/g, "")));
                }}
              />

              <p className="text-gray-500 text-xs lg:text-md mt-8">
                Kamu akan mendapatkan
              </p>
              <p className="font-semibold text-xl lg:text-3xl bg-gray-200 mt-2 p-4 rounded-md">
                {"BTC " + getBTCBuyAmount()}
              </p>

              <button
                onClick={() =>
                  processOrder("buy", getBTCBuyAmount(), buyTarget)
                }
                className="bg-[#0C68F4] w-full text-white rounded-md text-xs lg:text-md font-semibold p-2 mt-8"
              >
                Beli Bitcoin Sekarang
              </button>
            </div>

            <div className="mt-8 border-[1px] rounded-lg border-gray-300 p-8">
              <p className="font-semibold text-md lg:text-xl">
                Jual Bitcoin-mu
              </p>
              <p className="text-gray-500 text-xs lg:text-md mt-8">
                Masukkan jumlah coin yang ingin dijual:
              </p>
              <input
                className="w-full border-0 outline-none font-semibold text-xl lg:text-3xl bg-transparent mt-2 pb-2 border-b-2 border-gray-400"
                type="text"
                value={"BTC " + sellQty.toLocaleString().replace(/,/g, ".")}
                onChange={(e) => {
                  setSellQty(Number(e.target.value.replace(/[^0-9]/g, "")));
                }}
              />

              <p className="text-gray-500 text-xs lg:text-md mt-8">
                Masukkan harga jual per-coin:
              </p>
              <input
                className="w-full border-0 outline-none font-semibold text-xl lg:text-3xl bg-transparent mt-2 pb-2 border-b-2 border-gray-400"
                type="text"
                value={"Rp " + sellTarget.toLocaleString().replace(/,/g, ".")}
                onChange={(e) => {
                  setSellTarget(Number(e.target.value.replace(/[^0-9]/g, "")));
                }}
              />

              <p className="text-gray-500 text-xs lg:text-md mt-8">
                Kamu akan mendapatkan
              </p>
              <p className="font-semibold text-xl lg:text-3xl bg-gray-200 mt-2 p-4 rounded-md">
                {"Rp " + getSellAmount().toLocaleString().replace(/,/g, ".")}
              </p>

              <button
                onClick={() => processOrder("sell", sellQty, sellTarget)}
                className="bg-red-500 w-full text-white rounded-md text-xs lg:text-md font-semibold p-2 mt-8"
              >
                Jual Bitcoin Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
