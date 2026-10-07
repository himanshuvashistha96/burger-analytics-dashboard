import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "https://burger-analytics-api.onrender.com";

function App() {
  // =========================================================
  // STATE
  // =========================================================

  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    groups: [],
    order_types: [],
    brands: [],
  });

  const [loading, setLoading] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedOrderType, setSelectedOrderType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  // =========================================================
  // LOAD FILTER OPTIONS
  // =========================================================

  useEffect(() => {
    async function loadFilters() {
      try {
        const response = await fetch(`${API}/api/filters`);

        if (!response.ok) {
          throw new Error(`Filter API failed: ${response.status}`);
        }

        const data = await response.json();

        setFilters({
          groups: data.groups || [],
          order_types: data.order_types || [],
          brands: data.brands || [],
        });
      } catch (error) {
        console.error("Filter API error:", error);
      }
    }

    loadFilters();
  }, []);

  // =========================================================
  // LOAD DASHBOARD DATA
  // RUNS EVERY TIME A FILTER CHANGES
  // =========================================================

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (selectedGroup) {
          params.set("group", selectedGroup);
        }

        if (selectedOrderType) {
          params.set("order_type", selectedOrderType);
        }

        if (selectedBrand) {
          params.set("brand", selectedBrand);
        }

        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : "";

        console.log("Loading dashboard with filters:", {
          group: selectedGroup,
          order_type: selectedOrderType,
          brand: selectedBrand,
        });

        // All dashboard components use the SAME filters
        const [
          summaryResponse,
          trendResponse,
          outletsResponse,
          productsResponse,
        ] = await Promise.all([
          fetch(`${API}/api/summary${suffix}`),
          fetch(`${API}/api/revenue-trend${suffix}`),
          fetch(`${API}/api/outlets${suffix}`),
          fetch(`${API}/api/products${suffix}`),
        ]);

        if (!summaryResponse.ok) {
          throw new Error(
            `Summary API failed: ${summaryResponse.status}`
          );
        }

        if (!trendResponse.ok) {
          throw new Error(
            `Revenue API failed: ${trendResponse.status}`
          );
        }

        if (!outletsResponse.ok) {
          throw new Error(
            `Outlet API failed: ${outletsResponse.status}`
          );
        }

        if (!productsResponse.ok) {
          throw new Error(
            `Product API failed: ${productsResponse.status}`
          );
        }

        const summaryData = await summaryResponse.json();
        const trendData = await trendResponse.json();
        const outletsData = await outletsResponse.json();
        const productsData = await productsResponse.json();

        setSummary(summaryData || {});
        setTrend(Array.isArray(trendData) ? trendData : []);
        setOutlets(Array.isArray(outletsData) ? outletsData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error("Dashboard API error:", error);

        setSummary({});
        setTrend([]);
        setOutlets([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedGroup, selectedOrderType, selectedBrand]);

  // =========================================================
  // KPI VALUES
  // =========================================================

  const totalRevenue = Number(
    summary.total_revenue ?? 0
  );

  const totalOrders = Number(
    summary.total_orders ?? 0
  );

  // Use backend AOV when available.
  // Otherwise calculate it ourselves.
  const avgOrderValue = Number(
    summary.average_order_value ??
      (totalOrders > 0 ? totalRevenue / totalOrders : 0)
  );

  // IMPORTANT:
  // This comes from the backend summary and therefore
  // automatically respects the selected filters.
  const totalOutlets = Number(
    summary.outlets ?? 0
  );

  // =========================================================
  // TOP PRODUCTS
  // =========================================================

  const topProducts = useMemo(() => {
    return [...products]
      .sort(
        (a, b) =>
          Number(b.revenue ?? b.Revenue ?? 0) -
          Number(a.revenue ?? a.Revenue ?? 0)
      )
      .slice(0, 8);
  }, [products]);

  // =========================================================
  // REVENUE TREND
  // =========================================================

  const visibleTrend = useMemo(() => {
    return trend.slice(-15);
  }, [trend]);

  const maxRevenue = Math.max(
    ...visibleTrend.map((item) =>
      Number(
        item.revenue ??
          item.Revenue ??
          item.total_revenue ??
          0
      )
    ),
    1
  );

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="loading">
        <div className="loader"></div>

        <h2>Loading Burger Analytics...</h2>

        <p>Connecting to analytics API</p>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="topbar">

        <div>
          <div className="brand">
            BURGER ANALYTICS
          </div>

          <div className="subtitle">
            Sales &amp; Performance Intelligence Dashboard
          </div>
        </div>

        <div className="status">
          <span className="dot"></span>
          LIVE DATA
        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="content">

        {/* ===================================================
            HERO + FILTERS
        =================================================== */}

        <section className="hero">

          <div>
            <h1>
              Business Performance Overview
            </h1>

            <p>
              Analyze revenue, orders, outlets,
              products and ordering behaviour.
            </p>
          </div>


          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="filters">

            {/* GROUP */}

            <select
              value={selectedGroup}
              onChange={(e) =>
                setSelectedGroup(e.target.value)
              }
            >
              <option value="">
                All Groups
              </option>

              {filters.groups.map((item, index) => {
                const value =
                  item.value ??
                  item.Group ??
                  item.category ??
                  item;

                return (
                  <option
                    key={index}
                    value={value}
                  >
                    {value}
                  </option>
                );
              })}
            </select>


            {/* ORDER TYPE */}

            <select
              value={selectedOrderType}
              onChange={(e) =>
                setSelectedOrderType(e.target.value)
              }
            >
              <option value="">
                All Order Types
              </option>

              {filters.order_types.map((item, index) => {
                const value =
                  item.value ??
                  item.Order_Type ??
                  item.order_type ??
                  item;

                return (
                  <option
                    key={index}
                    value={value}
                  >
                    {value}
                  </option>
                );
              })}
            </select>


            {/* BRAND */}

            <select
              value={selectedBrand}
              onChange={(e) =>
                setSelectedBrand(e.target.value)
              }
            >
              <option value="">
                All Brands
              </option>

              {filters.brands.map((item, index) => {
                const value =
                  item.value ??
                  item.Brand ??
                  item.brand ??
                  item;

                return (
                  <option
                    key={index}
                    value={value}
                  >
                    {value}
                  </option>
                );
              })}
            </select>

          </div>

        </section>


        {/* ===================================================
            KPI CARDS
        =================================================== */}

        <section className="kpi-grid">

          {/* TOTAL REVENUE */}

          <div className="kpi-card">

            <span>
              Total Revenue
            </span>

            <strong>
              ₹
              {totalRevenue.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 0,
                }
              )}
            </strong>

            <small>
              Overall sales
            </small>

          </div>


          {/* TOTAL ORDERS */}

          <div className="kpi-card">

            <span>
              Total Orders
            </span>

            <strong>
              {totalOrders.toLocaleString(
                "en-IN"
              )}
            </strong>

            <small>
              Completed transactions
            </small>

          </div>


          {/* AVERAGE ORDER VALUE */}

          <div className="kpi-card">

            <span>
              Average Order Value
            </span>

            <strong>
              ₹
              {avgOrderValue.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 0,
                }
              )}
            </strong>

            <small>
              Revenue per order
            </small>

          </div>


          {/* OUTLETS */}

          <div className="kpi-card">

            <span>
              Outlets
            </span>

            <strong>
              {totalOutlets.toLocaleString(
                "en-IN"
              )}
            </strong>

            <small>
              Business locations
            </small>

          </div>

        </section>


        {/* ===================================================
            REVENUE TREND + TOP PRODUCTS
        =================================================== */}

        <section className="grid-two">

          {/* REVENUE TREND */}

          <div className="panel large">

            <div className="panel-header">

              <div>

                <h2>
                  Revenue Trend
                </h2>

                <p>
                  Revenue performance over time
                </p>

              </div>

            </div>


            <div className="chart">

              {visibleTrend.length === 0 ? (

                <div className="empty">
                  No trend data available
                </div>

              ) : (

                visibleTrend.map((item, index) => {

                  const value = Number(
                    item.revenue ??
                      item.Revenue ??
                      item.total_revenue ??
                      0
                  );

                  const height = `${Math.max(
                    (value / maxRevenue) * 100,
                    5
                  )}%`;

                  const date =
                    item.date ??
                    item.Date ??
                    item.month ??
                    item.Month ??
                    "";
                    const formattedDate = date
  ? new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    })
  : "";

                  return (
                    <div
                      className="bar-wrap"
                      key={`${date}-${index}`}
                    >

                      <div
                        className="bar"
                        style={{
                          height,
                        }}
                        title={`₹${value.toLocaleString(
                          "en-IN"
                        )}`}
                      ></div>

                      <span>
                        {formattedDate}
                      </span>

                    </div>
                  );
                })

              )}

            </div>

          </div>


          {/* TOP PRODUCTS */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <h2>
                  Top Products
                </h2>

                <p>
                  Highest revenue generating products
                </p>

              </div>

            </div>


            <div className="product-list">

              {topProducts.length === 0 ? (

                <div className="empty">
                  No product data available
                </div>

              ) : (

                topProducts.map((item, index) => {

                  const name =
                    item.Item ??
                    item.item ??
                    item.product ??
                    item.Product ??
                    "Product";

                  const revenue = Number(
                    item.revenue ??
                      item.Revenue ??
                      0
                  );

                  return (
                    <div
                      className="product-row"
                      key={`${name}-${index}`}
                    >

                      <div className="rank">
                        {index + 1}
                      </div>

                      <div className="product-name">
                        {name}
                      </div>

                      <div className="product-revenue">
                        ₹
                        {revenue.toLocaleString(
                          "en-IN"
                        )}
                      </div>

                    </div>
                  );
                })

              )}

            </div>

          </div>

        </section>


        {/* ===================================================
            OUTLET PERFORMANCE + BUSINESS INSIGHTS
        =================================================== */}

        <section className="grid-two">

          {/* OUTLET PERFORMANCE */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <h2>
                  Outlet Performance
                </h2>

                <p>
                  Revenue by outlet
                </p>

              </div>

            </div>


            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Outlet
                    </th>

                    <th>
                      Revenue
                    </th>

                    <th>
                      Orders
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {outlets.length === 0 ? (

                    <tr>
                      <td colSpan="3">
                        No outlet data available
                      </td>
                    </tr>

                  ) : (

                    outlets
                      .slice(0, 10)
                      .map((item, index) => {

                        const outlet =
                          item.Outlet_Name ??
                          item.Outlet ??
                          item.outlet ??
                          "Outlet";

                        const revenue = Number(
                          item.revenue ??
                            item.Revenue ??
                            0
                        );

                        const orders = Number(
                          item.orders ??
                            item.Orders ??
                            0
                        );

                        return (
                          <tr key={`${outlet}-${index}`}>

                            <td>
                              {outlet}
                            </td>

                            <td>
                              ₹
                              {revenue.toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td>
                              {orders.toLocaleString(
                                "en-IN"
                              )}
                            </td>

                          </tr>
                        );
                      })

                  )}

                </tbody>

              </table>

            </div>

          </div>


          {/* BUSINESS INSIGHTS */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <h2>
                  Business Insights
                </h2>

                <p>
                  Key observations from the dataset
                </p>

              </div>

            </div>


            <div className="insights">

              <div>

                <span>
                  💰
                </span>

                <p>
                  Total business revenue is{" "}
                  <b>
                    ₹
                    {totalRevenue.toLocaleString(
                      "en-IN"
                    )}
                  </b>.
                </p>

              </div>


              <div>

                <span>
                  🛒
                </span>

                <p>
                  The business processed{" "}
                  <b>
                    {totalOrders.toLocaleString(
                      "en-IN"
                    )}
                  </b>{" "}
                  orders.
                </p>

              </div>


              <div>

                <span>
                  📊
                </span>

                <p>
                  Average order value is
                  approximately{" "}
                  <b>
                    ₹
                    {avgOrderValue.toFixed(0)}
                  </b>.
                </p>

              </div>


              <div>

                <span>
                  🍔
                </span>

                <p>
                  Product-level analysis
                  identifies the strongest
                  revenue contributors.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer>
          Burger Analytics • Powered by FastAPI + DuckDB + React
        </footer>

      </main>

    </div>
  );
}

export default App;
