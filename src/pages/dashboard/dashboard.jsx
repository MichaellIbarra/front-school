import React from "react";
import FeatherIcon from "feather-icons-react/build/FeatherIcon";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import useTitle from "../../hooks/useTitle";

import {
  calendar,
  empty_wallet,
  imagesend,
  morning_img_01,
  profile_add,
  scissor,
}  from "../../components/imagepath";

import { Link } from "react-router-dom";
import CountUp from "react-countup";
import useAuth from "../../hooks/useAuth";

const Dashboard = () => {
  // Establecer título dinámico
  useTitle('Dashboard');
  const { user } = useAuth();


  return (
    <>
      <Header />
      <Sidebar
        id="menu-item"
        id1="menu-items"
        activeClassName="admin-dashboard"
      />
      <>
        <div className="page-wrapper">
          <div className="content">
            {/* Page Header */}
            <div className="page-header">
              <div className="row">
                <div className="col-sm-12">
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="#">Dashboard </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <i className="feather-chevron-right">
                        <FeatherIcon icon="chevron-right" />
                      </i>
                    </li>
                    <li className="breadcrumb-item active">Dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* /Page Header */}
            <div className="good-morning-blk">
              <div className="row">
                <div className="col-md-6">
                  <div className="morning-user">
                    <h2>
                      Hola, <span>{user?.name || 'Usuario'}</span>
                    </h2>
                  </div>
                </div>
                <div className="col-md-6 position-blk">
                  <div className="morning-img">
                    <img src={morning_img_01}
                     alt="#" />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 col-sm-6 col-lg-6 col-xl-3">
                <div className="dash-widget">
                  <div className="dash-boxs comman-flex-center">
                    <img src={calendar}  alt="#" />
                  </div>
                  <div className="dash-content dash-count flex-grow-1">
                    <h4>Appointments</h4>
                    <h2>
                      {" "}
                      <CountUp delay={0.4} end={250} duration={0.6} />
                    </h2>
                    <p>
                      <span className="passive-view">
                        <i className="feather-arrow-up-right me-1" >
                          <FeatherIcon icon="arrow-up-right"/>
                        </i>
                        40%
                      </span>{" "}
                      vs last month
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-sm-6 col-lg-6 col-xl-3">
                <div className="dash-widget">
                  <div className="dash-boxs comman-flex-center">
                    <img src={profile_add}  alt="#" />
                  </div>
                  <div className="dash-content dash-count">
                    <h4>Nuevos Alumnos</h4>
                    <h2>
                      <CountUp delay={0.4} end={140} duration={0.6} />
                    </h2>
                    <p>
                      <span className="passive-view">
                        <i className="feather-arrow-up-right me-1">
                          <FeatherIcon icon="arrow-up-right" />
                          </i>
                        20%
                      </span>{" "}
                      vs last month
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-sm-6 col-lg-6 col-xl-3">
                <div className="dash-widget">
                  <div className="dash-boxs comman-flex-center">
                    <img src={scissor} alt="#" />
                  </div>
                  <div className="dash-content dash-count">
                    <h4>Operations</h4>
                    <h2>
                      <CountUp delay={0.4} end={56} duration={0.6} />
                    </h2>
                    <p>
                      <span className="negative-view">
                        <i className="feather-arrow-down-right me-1">
                          <FeatherIcon icon="arrow-down-right"/>
                          </i>
                        15%
                      </span>{" "}
                      vs last month
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-sm-6 col-lg-6 col-xl-3">
                <div className="dash-widget">
                  <div className="dash-boxs comman-flex-center">
                    <img src={empty_wallet} alt="#" />
                  </div>
                  <div className="dash-content dash-count">
                    <h4>Earnings</h4>
                    <h2>
                      $<CountUp delay={0.4} end={20250} duration={0.6} />
                    </h2>
                    <p>
                      <span className="passive-view">
                        <i className="feather-arrow-up-right me-1">
                          <FeatherIcon icon="arrow-up-right"/>
                          </i>
                        30%
                      </span>{" "}
                      vs last month
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="delete_patient" className="modal fade delete-modal" role="dialog">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-body text-center">
          <img src={imagesend} alt="#" width={50} height={46} />
          <h3>Are you sure want to delete this ?</h3>
          <div className="m-t-20">
            {" "}
            <Link to="#" className="btn btn-white me-2" data-bs-dismiss="modal">
              Close
            </Link>
            <button type="submit" className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    <div id="delete_patient" className="modal fade delete-modal" role="dialog">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-body text-center">
          <img src={imagesend} alt="#" width={50} height={46} />
          <h3>Are you sure want to delete this ?</h3>
          <div className="m-t-20">
            {" "}
            <Link to="#" className="btn btn-white me-2" data-bs-dismiss="modal">
              Close
            </Link>
            <button type="submit" className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
        </div>
      </>
    </>
  );
};

export default Dashboard;
