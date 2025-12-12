import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductItem from "./ProductItem";
import slugify from "slugify";
import Pagination from "react-js-pagination";
import ModalAdvanced from "../../components/Modal/ModalAdvanced";
import { formatPrice } from "../../utils/formatPrice";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

const ProductList = ({ data, handlePageClick, page, totalPage }) => {
  const navigate = useNavigate();
  const bodyStyle = document.body.style;
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleClick = (item) => {
    const path = slugify(item.title, { strict: true });
    navigate(`/${path}/${item._id}`);
  };

  const addToCompare = (item) => {
    if (selectedItems.length < 2 && !selectedItems.find(i => i._id === item._id)) {
        setSelectedItems((prev) => [...prev, item]);
    }
  };

  const removeFromCompare = (item) => {
    const filteredItems = selectedItems.filter(
      (product) => product._id !== item._id // Assuming _id is the unique identifier
    );
    setSelectedItems(filteredItems);
  };

  useEffect(() => {
    if (selectedItems.length === 2) {
      setShowModal(true);
    }
  }, [selectedItems]);

  useEffect(() => {
    if (showModal) {
      disableBodyScroll(bodyStyle);
    } else {
      enableBodyScroll(bodyStyle);
    }
  }, [showModal, bodyStyle]);

  // Safe check for data array
  const products = Array.isArray(data) ? data : [];

  return (
    <>
      <div className="mt-20">
        <div className="flex flex-col container rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <span className="font-bold text-xl text-gray-800">Laptop</span>
            <div 
                className="flex items-center gap-x-1 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => navigate("/product")}
            >
              <span className="text-sm font-semibold text-gray-500">Xem tất cả</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
            {products.length > 0 ? (
              products.map((item, index) => (
                <ProductItem
                  key={item._id || index}
                  product={item}
                  onClickItem={() => handleClick(item)}
                  className="border border-gray-100 hover:shadow-md transition-shadow"
                  selected={selectedItems}
                  addToCompare={addToCompare}
                  removeFromCompare={removeFromCompare}
                />
              ))
            ) : (
                <div className="col-span-5 text-center py-10 text-gray-500">
                    Không có sản phẩm nào.
                </div>
            )}
          </div>
        </div>

        {/* FIX: Only render pagination if totalPage exists and is > 0 */}
        {totalPage && totalPage > 0 ? (
            <div className="flex justify-center items-center mt-8">
            <Pagination
                activePage={page}
                itemsCountPerPage={10} // Ensure this matches your API limit
                totalItemsCount={totalPage}
                pageRangeDisplayed={5}
                onChange={handlePageClick}
                nextPageText=">"
                prevPageText="<"
                firstPageText="<<"
                lastPageText=">>"
                itemClass="page-item"
                linkClass="page-link"
                activeClass="active"
            />
            </div>
        ) : null}
      </div>

      {selectedItems.length === 2 && (
        <ModalAdvanced
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItems([]);
          }}
          bodyClassName="w-[90vw] max-w-[1050px] bg-white rounded-xl relative z-50 h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="overflow-y-auto p-6 flex-1">
            <h3 className="text-2xl font-bold text-center mb-6 text-blue-800">So Sánh Chi Tiết</h3>
            <table className="table-auto w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-3 border">Tiêu chí</th>
                  <th className="p-3 border w-1/3 text-blue-700">{selectedItems[0]?.title}</th>
                  <th className="p-3 border w-1/3 text-blue-700">{selectedItems[1]?.title}</th>
                </tr>
              </thead>
              <tbody>
                {/* Images */}
                <tr>
                  <td className="p-3 border font-semibold">Hình ảnh</td>
                  <td className="p-3 border text-center">
                    <img src={selectedItems[0]?.images?.[0]} alt="" className="w-32 h-32 object-contain mx-auto" />
                  </td>
                  <td className="p-3 border text-center">
                    <img src={selectedItems[1]?.images?.[0]} alt="" className="w-32 h-32 object-contain mx-auto" />
                  </td>
                </tr>
                {/* Price */}
                <tr>
                    <td className="p-3 border font-semibold">Giá bán</td>
                    <td className="p-3 border text-center font-bold text-red-600">{formatPrice(selectedItems[0]?.promotion)}</td>
                    <td className="p-3 border text-center font-bold text-red-600">{formatPrice(selectedItems[1]?.promotion)}</td>
                </tr>
                {/* Brand */}
                <tr>
                    <td className="p-3 border font-semibold">Thương hiệu</td>
                    <td className="p-3 border text-center">{selectedItems[0]?.brand?.name}</td>
                    <td className="p-3 border text-center">{selectedItems[1]?.brand?.name}</td>
                </tr>
                 {/* Specs Loop */}
                 {[
                    { label: "CPU", key: "cpu" },
                    { label: "RAM", key: "ram" },
                    { label: "Màn hình", key: "screen" },
                    { label: "Card đồ họa", key: "graphicCard" },
                    { label: "Pin", key: "battery" },
                    { label: "Trọng lượng", key: "weight" },
                    { label: "OS", key: "os" },
                 ].map((spec) => (
                    <tr key={spec.key}>
                        <td className="p-3 border font-semibold">{spec.label}</td>
                        <td className="p-3 border text-center">{selectedItems[0]?.[spec.key]}</td>
                        <td className="p-3 border text-center">{selectedItems[1]?.[spec.key]}</td>
                    </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </ModalAdvanced>
      )}
    </>
  );
};

export default ProductList;