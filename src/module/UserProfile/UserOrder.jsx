import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import queryString from "query-string";
import { toast } from "react-toastify";
import { format } from "date-fns";
import Pagination from "react-js-pagination";

import Table from "../../components/table/Table";
import DashboardHeading from "../dashboard/DashboardHeding";
import Skeleton from "../../components/skeleton/Skeleton";
import { formatPrice } from "../../utils/formatPrice";
import { getOrder, refresh } from "../../redux/order/orderSlice";
import { action_status } from "../../utils/constants/status";


// Map order status keys to their display names and styles
const ORDER_STATUSES = {
  All: { name: "Tất cả đơn hàng", className: "bg-gray-200 text-gray-700" }, // Special case for filter
  Processed: { name: "Đang xử lý", className: "bg-orange-400 text-white" },
  'Waiting Goods': { name: "Đợi lấy hàng", className: "bg-yellow-400 text-white" }, // Added missing status
  Success: { name: "Thành công", className: "bg-green-400 text-white" },
  Cancelled: { name: "Đã hủy đơn", className: "bg-red-400 text-white" },
};

const UserOrder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Redux State
  const { status, totalPage, order, update } = useSelector((state) => state.order);
  const { current } = useSelector((state) => state.user);

  // --- State Initialization and Logic ---
  const params = useMemo(() => queryString.parse(location.search), [location.search]);
  const initialStatus = params.status || 'All';

  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);

  // Effect 1: Check Authentication
  useEffect(() => {
    if (current === null) {
      toast.dismiss();
      toast.warning("Vui lòng đăng nhập");
      navigate("/sign-in");
    }
  }, [current, navigate]);

  // Effect 2: Fetch Orders whenever filterStatus, page, or update changes
  useEffect(() => {
    if (!current?._id) return; // Wait for user data

    const data = {
      id: current._id,
      page: page,
      status: filterStatus,
      limit: 5,
    };
    
    // NOTE: The previous backend discussion suggested the `id` param here might be redundant
    // if the backend uses `req.user.id` to filter. If your backend needs `id` to be passed
    // explicitly, this is fine, but it makes the request less secure/standard.

    dispatch(getOrder(data));
    dispatch(refresh()); // Clear update flag if needed for fresh data
    
  }, [page, filterStatus, update, current?._id, dispatch]);
  
  // Effect 3: Sync URL query string to internal state (when status button is clicked)
  useEffect(() => {
      // Update state if the URL changes externally (though the button handlers do this too)
      const currentUrlStatus = queryString.parse(location.search).status || 'All';
      setFilterStatus(currentUrlStatus);
  }, [location.search]);

  // Handler for status buttons
  const handleClick = useCallback((e) => {
    const newStatus = e.target.value;
    setFilterStatus(newStatus);
    navigate(`/account/orders?status=${newStatus}`);
    setPage(1); // Reset page to 1 on filter change
  }, [navigate]);

  // Handler for pagination
  const handlePageClick = useCallback((values) => {
    setPage(values);
  }, []);

  // --- Render Helpers ---

  // Helper function to get status badge style
  const getStatusBadge = (statusKey) => {
    const statusInfo = ORDER_STATUSES[statusKey];
    if (!statusInfo) return null;

    // Use a simpler approach to map the order status to its display name
    let displayName = statusKey;
    if (statusKey === 'Processed') displayName = 'Đang xử lý';
    else if (statusKey === 'Waiting Goods') displayName = 'Đợi lấy hàng';
    else if (statusKey === 'Success') displayName = 'Thành công';
    else if (statusKey === 'Cancelled') displayName = 'Đã hủy đơn';

    return (
      <span className={`p-2 rounded-lg ${statusInfo.className}`}>
        {displayName}
      </span>
    );
  };
  
  // Helper to render a single table row
  const renderTableRow = (item) => (
    <tr className="text-base" key={item._id}>
      <td
        className="cursor-pointer text-blue-600 hover:text-blue-900"
        onClick={() => navigate(`/account/orders/${item._id}`)}
        title={item._id}
      >
        {item._id.slice(0, 10)}...
      </td>
      <td>
        {format(new Date(item?.createdAt), "HH:mm")}
        &nbsp;&nbsp;
        {format(new Date(item?.createdAt), "dd/MM/yyyy")}
      </td>
      <td>{item.cart[0]?.product?.title?.slice(0, 50) || 'N/A'}</td>
      <td>{formatPrice(item.totalPrice)}</td>
      <td>{getStatusBadge(item.status)}</td>
    </tr>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardHeading
          title="Quản lý đơn hàng"
          className="px-5 py-5"
        ></DashboardHeading>
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-x-3">
            {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                // Skip 'Waiting Goods' if you only want top-level filters. 
                // If you want all, include it here. I'll include it for completeness.
                (key !== 'Waiting Goods' || filterStatus === 'Waiting Goods') && (
                    <button
                        key={key}
                        className={`cursor-pointer py-2 px-4 text-base font-medium rounded-lg border border-gray-300 ${
                            filterStatus === key || (filterStatus === 'All' && key === 'All')
                                ? "bg-blue-500 text-white"
                                : ""
                        }`}
                        value={key}
                        onClick={handleClick}
                    >
                        {value.name}
                    </button>
                )
            ))}
        </div>
      </div>

      {/* --- Order List Rendering --- */}
      {status === action_status.LOADING && (
        <Table>
          <thead>
            <tr>
              <th>Mã đơn hàng</th>
              <th>Ngày mua</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td><Skeleton className="w-40 h-5 rounded-md" /></td>
                <td><Skeleton className="w-40 h-5 rounded-md" /></td>
                <td><Skeleton className="w-40 h-5 rounded-md" /></td>
                <td><Skeleton className="w-40 h-5 rounded-md" /></td>
                <td><Skeleton className="w-40 h-5 rounded-md" /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {status === action_status.SUCCEEDED && (
        <>
          {order?.length === 0 ? (
            <div className="bg-white container rounded-lg h-[400px] flex flex-col items-center justify-center gap-y-3 ">
              <img
                src="../images/logo-cart.png"
                alt="Empty Cart Icon"
                className="w-[250px] h-[250px]"
              />
              <span className="text-lg font-medium text-gray-400">
                Hiện không có đơn hàng nào
              </span>
            </div>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Ngày mua</th>
                    <th>Sản phẩm</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {/* CONSOLIDATED RENDERING LOGIC */}
                  {order?.map(renderTableRow)} 
                </tbody>
              </Table>
              {/* Pagination */}
              <div className="flex items-center justify-center mt-5">
                <Pagination
                  activePage={page}
                  nextPageText={">"}
                  prevPageText={"<"}
                  totalItemsCount={totalPage * 5} // Assuming totalPage is the count of pages, total items = pages * limit (5)
                  itemsCountPerPage={5} // Set this to the limit you use in the effect (5)
                  firstPageText={"<<"}
                  lastPageText={">>"}
                  linkClass="page-num"
                  onChange={handlePageClick}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* --- Failure State Rendering --- */}
      {status === action_status.FAILED && (
        <div className="bg-white container rounded-lg h-[400px] flex flex-col items-center justify-center gap-y-3 ">
          <img
            src="../images/logo-cart.png"
            alt="Empty Cart Icon"
            className="w-[250px] h-[250px]"
          />
          <span className="text-lg font-medium text-gray-400">
            {/* Dynamic message based on filter status */}
            {filterStatus === "All" && "Hiện không có đơn hàng nào."}
            {filterStatus === "Success" && "Hiện không có đơn hàng nào thành công."}
            {filterStatus === "Processed" && "Hiện không có đơn hàng nào chờ xử lý."}
            {filterStatus === "Cancelled" && "Hiện không có đơn hàng nào trong danh sách hủy."}
            {filterStatus === "Waiting Goods" && "Hiện không có đơn hàng nào đang chờ lấy hàng."}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserOrder;