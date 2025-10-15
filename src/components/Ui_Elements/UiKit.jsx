import React from 'react'
import Header from "../Header";
import Sidebar from '../Sidebar';
import FeatherIcon from 'feather-icons-react/build/FeatherIcon';
import UiKit_Bar from './UiKit_Bar';
import { Link } from "react-router-dom";
const UiKit = () => {
    return (
        <>
            <Header />
            <Sidebar id='menu-item14' id1='menu-items14' activeClassName='uikit' />
            <>
                <div className="page-wrapper">
                    <div className="content">
                        {/* Page Header */}
                        <div className="page-header">
                            <div className="row">
                                <div className="col-sm-12">
                                    <ul className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="#">Dashboard </Link></li>
                                        <li className="breadcrumb-item"><i className="feather-chevron-right">
                                            <FeatherIcon icon="chevron-right" />
                                        </i>
                                        </li>
                                        <li className="breadcrumb-item active">Uikit</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        {/* /Page Header */}
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card-box">
                                    <i className="fa fa-address-book" data-bs-toggle="tooltip" title="fa fa-address-book"></i>
                                    <i className="fa fa-address-card" data-bs-toggle="tooltip" title="fa fa-address-card"></i>
                                    <i className="fa fa-align-center" data-bs-toggle="tooltip" title="fa fa-align-center"></i>
                                    <i className="fa fa-align-justify" data-bs-toggle="tooltip" title="fa fa-align-justify"></i>
                                    <i className="fa fa-align-left" data-bs-toggle="tooltip" title="fa fa-align-left"></i>
                                    <i className="fa fa-align-right" data-bs-toggle="tooltip" title="fa fa-align-right"></i>
                                    <i className="fa fa-ambulance" data-bs-toggle="tooltip" title="fa fa-ambulance"></i>
                                    <i className="fa fa-american-sign-language-interpreting" data-bs-toggle="tooltip" title="fa fa-american-sign-language-interpreting"></i>
                                    <i className="fa fa-anchor" data-bs-toggle="tooltip" title="fa fa-anchor"></i>
                                    <i className="fa fa-angle-double-down" data-bs-toggle="tooltip" title="fa fa-angle-double-down"></i>
                                    <i className="fa fa-angle-double-left" data-bs-toggle="tooltip" title="fa fa-angle-double-left"></i>
                                    <i className="fa fa-angle-double-right" data-bs-toggle="tooltip" title="fa fa-angle-double-right"></i>
                                    <i className="fa fa-angle-double-up" data-bs-toggle="tooltip" title="fa fa-angle-double-up"></i>
                                    <i className="fa fa-angle-down" data-bs-toggle="tooltip" title="fa fa-angle-down"></i>
                                    <i className="fa fa-angle-left" data-bs-toggle="tooltip" title="fa fa-angle-left"></i>
                                    <i className="fa fa-angle-right" data-bs-toggle="tooltip" title="fa fa-angle-right"></i>
                                    <i className="fa fa-angle-up" data-bs-toggle="tooltip" title="fa fa-angle-up"></i>
                                    <i className="fab fa-apple" data-bs-toggle="tooltip" title="fab fa-apple"></i>
                                    <i className="fa fa-archive" data-bs-toggle="tooltip" title="fa fa-archive"></i>
                                    <i className="fas fa-chart-area" data-bs-toggle="tooltip" title="fas fa-chart-area"></i>
                                    <i className="fa fa-arrow-circle-down" data-bs-toggle="tooltip" title="fa fa-arrow-circle-down"></i>
                                    <i className="fa fa-arrow-circle-left" data-bs-toggle="tooltip" title="fa fa-arrow-circle-left"></i>
                                    <i className="fa fa-arrow-circle-right" data-bs-toggle="tooltip" title="fa fa-arrow-circle-right"></i>
                                    <i className="fa fa-arrow-circle-up" data-bs-toggle="tooltip" title="fa fa-arrow-circle-up"></i>
                                    <i className="fa fa-arrow-down" data-bs-toggle="tooltip" title="fa fa-arrow-down"></i>
                                    <i className="fa fa-arrow-left" data-bs-toggle="tooltip" title="fa fa-arrow-left"></i>
                                    <i className="fa fa-arrow-right" data-bs-toggle="tooltip" title="fa fa-arrow-right"></i>
                                    <i className="fa fa-arrow-up" data-bs-toggle="tooltip" title="fa fa-arrow-up"></i>
                                    <i className="fa fa-arrows-alt" data-bs-toggle="tooltip" title="fa fa-arrows-alt"></i>
                                    <i className="fa fa-assistive-listening-systems" data-bs-toggle="tooltip" title="fa fa-assistive-listening-systems"></i>
                                    <i className="fa fa-asterisk" data-bs-toggle="tooltip" title="fa fa-asterisk"></i>
                                    <i className="fa fa-at" data-bs-toggle="tooltip" title="fa fa-at"></i>
                                    <i className="fa fa-audio-description" data-bs-toggle="tooltip" title="fa fa-audio-description"></i>
                                    <i className="fa fa-backward" data-bs-toggle="tooltip" title="fa fa-backward"></i>
                                    <i className="fa fa-balance-scale" data-bs-toggle="tooltip" title="fa fa-balance-scale"></i>
                                    <i className="fa fa-ban" data-bs-toggle="tooltip" title="fa fa-ban"></i>
                                    <i className="fa fa-barcode" data-bs-toggle="tooltip" title="fa fa-barcode"></i>
                                    <i className="fa fa-bars" data-bs-toggle="tooltip" title="fa fa-bars"></i>
                                    <i className="fa fa-bath" data-bs-toggle="tooltip" title="fa fa-bath"></i>
                                    <i className="fa fa-battery-empty" data-bs-toggle="tooltip" title="fa fa-battery-empty"></i>
                                    <i className="fa fa-battery-full" data-bs-toggle="tooltip" title="fa fa-battery-full"></i>
                                    <i className="fa fa-battery-half" data-bs-toggle="tooltip" title="fa fa-battery-half"></i>
                                    <i className="fa fa-battery-quarter" data-bs-toggle="tooltip" title="fa fa-battery-quarter"></i>
                                    <i className="fa fa-battery-three-quarters" data-bs-toggle="tooltip" title="fa fa-battery-three-quarters"></i>
                                    <i className="fa fa-bed" data-bs-toggle="tooltip" title="fa fa-bed"></i>
                                    <i className="fa fa-beer" data-bs-toggle="tooltip" title="fa fa-beer"></i>
                                    <i className="fa fa-bell" data-bs-toggle="tooltip" title="fa fa-bell"></i>
                                    <i className="fa fa-bell-slash" data-bs-toggle="tooltip" title="fa fa-bell-slash"></i>
                                    <i className="fa fa-bicycle" data-bs-toggle="tooltip" title="fa fa-bicycle"></i>
                                    <i className="fa fa-binoculars" data-bs-toggle="tooltip" title="fa fa-binoculars"></i>
                                    <i className="fa fa-birthday-cake" data-bs-toggle="tooltip" title="fa fa-birthday-cake"></i>
                                    <i className="fa fa-blind" data-bs-toggle="tooltip" title="fa fa-blind"></i>
                                    <i className="fa fa-bold" data-bs-toggle="tooltip" title="fa fa-bold"></i>
                                    <i className="fa fa-bolt" data-bs-toggle="tooltip" title="fa fa-bolt"></i>
                                    <i className="fa fa-bomb" data-bs-toggle="tooltip" title="fa fa-bomb"></i>
                                    <i className="fa fa-book" data-bs-toggle="tooltip" title="fa fa-book"></i>
                                    <i className="fa fa-bookmark" data-bs-toggle="tooltip" title="fa fa-bookmark"></i>
                                    <i className="fa fa-braille" data-bs-toggle="tooltip" title="fa fa-braille"></i>
                                    <i className="fa fa-briefcase" data-bs-toggle="tooltip" title="fa fa-briefcase"></i>
                                    <i className="fa fa-bug" data-bs-toggle="tooltip" title="fa fa-bug"></i>
                                    <i className="fa fa-building" data-bs-toggle="tooltip" title="fa fa-building"></i>
                                    <i className="fa fa-bullhorn" data-bs-toggle="tooltip" title="fa fa-bullhorn"></i>
                                    <i className="fa fa-bullseye" data-bs-toggle="tooltip" title="fa fa-bullseye"></i>
                                    <i className="fa fa-bus" data-bs-toggle="tooltip" title="fa fa-bus"></i>
                                    <i className="fa fa-calculator" data-bs-toggle="tooltip" title="fa fa-calculator"></i>
                                    <i className="fa fa-calendar" data-bs-toggle="tooltip" title="fa fa-calendar"></i>
                                    <i className="fa fa-camera" data-bs-toggle="tooltip" title="fa fa-camera"></i>
                                    <i className="fa fa-camera-retro" data-bs-toggle="tooltip" title="fa fa-camera-retro"></i>
                                    <i className="fa fa-car" data-bs-toggle="tooltip" title="fa fa-car"></i>
                                    <i className="fa fa-caret-down" data-bs-toggle="tooltip" title="fa fa-caret-down"></i>
                                    <i className="fa fa-caret-left" data-bs-toggle="tooltip" title="fa fa-caret-left"></i>
                                    <i className="fa fa-caret-right" data-bs-toggle="tooltip" title="fa fa-caret-right"></i>
                                    <i className="fa fa-cart-arrow-down" data-bs-toggle="tooltip" title="fa fa-cart-arrow-down"></i>
                                    <i className="fa fa-cart-plus" data-bs-toggle="tooltip" title="fa fa-cart-plus"></i>
                                    <i className="fa fa-certificate" data-bs-toggle="tooltip" title="fa fa-certificate"></i>
                                    <i className="fa fa-check" data-bs-toggle="tooltip" title="fa fa-check"></i>
                                    <i className="fa fa-check-circle" data-bs-toggle="tooltip" title="fa fa-check-circle"></i>
                                    <i className="fa fa-chevron-circle-left" data-bs-toggle="tooltip" title="fa fa-chevron-circle-left"></i>
                                    <i className="fa fa-chevron-circle-right" data-bs-toggle="tooltip" title="fa fa-chevron-circle-right"></i>
                                    <i className="fa fa-chevron-circle-up" data-bs-toggle="tooltip" title="fa fa-chevron-circle-up"></i>
                                    <i className="fa fa-chevron-down" data-bs-toggle="tooltip" title="fa fa-chevron-down"></i>
                                    <i className="fa fa-chevron-left" data-bs-toggle="tooltip" title="fa fa-chevron-left"></i>
                                    <i className="fa fa-chevron-right" data-bs-toggle="tooltip" title="fa fa-chevron-right"></i>
                                    <i className="fa fa-chevron-up" data-bs-toggle="tooltip" title="fa fa-chevron-up"></i>
                                    <i className="fa fa-child" data-bs-toggle="tooltip" title="fa fa-child"></i>
                                    <i className="fa fa-circle" data-bs-toggle="tooltip" title="fa fa-circle"></i>
                                    <i className="fa fa-clipboard" data-bs-toggle="tooltip" title="fa fa-clipboard"></i>
                                    <i className="fa fa-clone" data-bs-toggle="tooltip" title="fa fa-clone"></i>
                                    <i className="fa fa-cloud" data-bs-toggle="tooltip" title="fa fa-cloud"></i>
                                    <i className="fa fa-code" data-bs-toggle="tooltip" title="fa fa-code"></i>
                                    <i className="fa fa-coffee" data-bs-toggle="tooltip" title="fa fa-coffee"></i>
                                    <i className="fa fa-cog" data-bs-toggle="tooltip" title="fa fa-cog"></i>
                                    <i className="fa fa-cogs" data-bs-toggle="tooltip" title="fa fa-cogs"></i>
                                    <i className="fa fa-columns" data-bs-toggle="tooltip" title="fa fa-columns"></i>
                                    <i className="fa fa-comment" data-bs-toggle="tooltip" title="fa fa-comment"></i>
                                    <i className="fa fa-compress" data-bs-toggle="tooltip" title="fa fa-compress"></i>
                                    <i className="fa fa-copyright" data-bs-toggle="tooltip" title="fa fa-copyright"></i>
                                    <i className="fa fa-credit-card" data-bs-toggle="tooltip" title="fa fa-credit-card"></i>
                                    <i className="fa fa-desktop" data-bs-toggle="tooltip" title="fa fa-desktop"></i>
                                    <i className="fa fa-edit" data-bs-toggle="tooltip" title="fa fa-edit"></i>
                                    <i className="fa fa-eject" data-bs-toggle="tooltip" title="fa fa-eject"></i>
                                    <i className="fa fa-ellipsis-h" data-bs-toggle="tooltip" title="fa fa-ellipsis-h"></i>
                                    <i className="fa fa-ellipsis-v" data-bs-toggle="tooltip" title="fa fa-ellipsis-v"></i>
                                    <i className="fa fa-envelope" data-bs-toggle="tooltip" title="fa fa-envelope"></i>
                                    <i className="fa fa-envelope-open" data-bs-toggle="tooltip" title="fa fa-envelope-open"></i>
                                    <i className="fa fa-envelope-square" data-bs-toggle="tooltip" title="fa fa-envelope-square"></i>
                                    <i className="fa fa-eraser" data-bs-toggle="tooltip" title="fa fa-eraser"></i>
                                    <i className="fa fa-exclamation" data-bs-toggle="tooltip" title="fa fa-exclamation"></i>
                                    <i className="fa fa-exclamation-circle" data-bs-toggle="tooltip" title="fa fa-exclamation-circle"></i>
                                    <i className="fa fa-exclamation-triangle" data-bs-toggle="tooltip" title="fa fa-exclamation-triangle"></i>
                                    <i className="fa fa-expand" data-bs-toggle="tooltip" title="fa fa-expand"></i>
                                    <i className="fa fa-eye" data-bs-toggle="tooltip" title="fa fa-eye"></i>
                                    <i className="fa fa-eye-slash" data-bs-toggle="tooltip" title="fa fa-eye-slash"></i>
                                    <i className="fa fa-fast-backward" data-bs-toggle="tooltip" title="fa fa-fast-backward"></i>
                                    <i className="fa fa-fast-forward" data-bs-toggle="tooltip" title="fa fa-fast-forward"></i>
                                    <i className="fa fa-fax" data-bs-toggle="tooltip" title="fa fa-fax"></i>
                                    <i className="fa fa-female" data-bs-toggle="tooltip" title="fa fa-female"></i>
                                    <i className="fa fa-fighter-jet" data-bs-toggle="tooltip" title="fa fa-fighter-jet"></i>
                                    <i className="fa fa-file" data-bs-toggle="tooltip" title="fa fa-file"></i>
                                    <i className="fa fa-fire" data-bs-toggle="tooltip" title="fa fa-fire"></i>
                                    <i className="fa fa-fire-extinguisher" data-bs-toggle="tooltip" title="fa fa-fire-extinguisher"></i>
                                    <i className="fa fa-flag" data-bs-toggle="tooltip" title="fa fa-flag"></i>
                                    <i className="fa fa-flag-checkered" data-bs-toggle="tooltip" title="fa fa-flag-checkered"></i>
                                    <i className="fa fa-road" data-bs-toggle="tooltip" title="fa fa-road"></i>
                                    <i className="fa fa-rocket" data-bs-toggle="tooltip" title="fa fa-rocket"></i>
                                    <i className="fa fa-save" data-bs-toggle="tooltip" title="fa fa-save"></i>
                                    <i className="fa fa-search" data-bs-toggle="tooltip" title="fa fa-search"></i>
                                    <i className="fa fa-search-minus" data-bs-toggle="tooltip" title="fa fa-search-minus"></i>
                                    <i className="fa fa-search-plus" data-bs-toggle="tooltip" title="fa fa-search-plus"></i>
                                    <i className="fa fa-server" data-bs-toggle="tooltip" title="fa fa-server"></i>
                                    <i className="fa fa-share" data-bs-toggle="tooltip" title="fa fa-share"></i>
                                    <i className="fa fa-share-alt" data-bs-toggle="tooltip" title="fa fa-share-alt"></i>
                                    <i className="fa fa-share-alt-square" data-bs-toggle="tooltip" title="fa fa-share-alt-square"></i>
                                    <i className="fa fa-share-square" data-bs-toggle="tooltip" title="fa fa-share-square"></i>
                                    <i className="fa fa-ship" data-bs-toggle="tooltip" title="fa fa-ship"></i>
                                    <i className="fa fa-shopping-bag" data-bs-toggle="tooltip" title="fa fa-shopping-bag"></i>
                                    <i className="fa fa-shopping-basket" data-bs-toggle="tooltip" title="fa fa-shopping-basket"></i>
                                    <i className="fa fa-shopping-cart" data-bs-toggle="tooltip" title="fa fa-shopping-cart"></i>
                                    <i className="fa fa-shower" data-bs-toggle="tooltip" title="fa fa-shower"></i>
                                    <i className="fa fa-sign-language" data-bs-toggle="tooltip" title="fa fa-sign-language"></i>
                                    <i className="fa fa-signal" data-bs-toggle="tooltip" title="fa fa-signal"></i>
                                    <i className="fa fa-sitemap" data-bs-toggle="tooltip" title="fa fa-sitemap"></i>
                                    <i className="fa fa-sort" data-bs-toggle="tooltip" title="fa fa-sort"></i>
                                    <i className="fa fa-sort-down" data-bs-toggle="tooltip" title="fa fa-sort-down"></i>
                                    <i className="fa fa-square" data-bs-toggle="tooltip" title="fa fa-square"></i>
                                    <i className="fa fa-star" data-bs-toggle="tooltip" title="fa fa-star"></i>
                                    <i className="fa fa-star-half" data-bs-toggle="tooltip" title="fa fa-star-half"></i>
                                    <i className="fa fa-step-backward" data-bs-toggle="tooltip" title="fa fa-step-backward"></i>
                                    <i className="fa fa-step-forward" data-bs-toggle="tooltip" title="fa fa-step-forward"></i>
                                    <i className="fa fa-stethoscope" data-bs-toggle="tooltip" title="fa fa-stethoscope"></i>
                                    <i className="fa fa-sticky-note" data-bs-toggle="tooltip" title="fa fa-sticky-note"></i>
                                    <i className="fa fa-stop" data-bs-toggle="tooltip" title="fa fa-stop"></i>
                                    <i className="fa fa-stop-circle" data-bs-toggle="tooltip" title="fa fa-stop-circle"></i>
                                    <i className="fa fa-street-view" data-bs-toggle="tooltip" title="fa fa-street-view"></i>
                                    <i className="fa fa-subscript" data-bs-toggle="tooltip" title="fa fa-subscript"></i>
                                    <i className="fa fa-suitcase" data-bs-toggle="tooltip" title="fa fa-suitcase"></i>
                                    <i className="fa fa-superscript" data-bs-toggle="tooltip" title="fa fa-superscript"></i>
                                    <i className="fa fa-table" data-bs-toggle="tooltip" title="fa fa-table"></i>
                                    <i className="fa fa-tag" data-bs-toggle="tooltip" title="fa fa-tag"></i>
                                    <i className="fa fa-tags" data-bs-toggle="tooltip" title="fa fa-tags"></i>
                                    <i className="fa fa-tasks" data-bs-toggle="tooltip" title="fa fa-tasks"></i>
                                    <i className="fa fa-taxi" data-bs-toggle="tooltip" title="fa fa-taxi"></i>
                                    <i className="fa fa-terminal" data-bs-toggle="tooltip" title="fa fa-terminal"></i>
                                    <i className="fa fa-text-height" data-bs-toggle="tooltip" title="fa fa-text-height"></i>
                                    <i className="fa fa-text-width" data-bs-toggle="tooltip" title="fa fa-text-width"></i>
                                    <i className="fa fa-th" data-bs-toggle="tooltip" title="fa fa-th"></i>
                                    <i className="fa fa-th-large" data-bs-toggle="tooltip" title="fa fa-th-large"></i>
                                    <i className="fa fa-th-list" data-bs-toggle="tooltip" title="fa fa-th-list"></i>
                                    <i className="fa fa-thermometer" data-bs-toggle="tooltip" title="fa fa-thermometer"></i>
                                    <i className="fa fa-thermometer-empty" data-bs-toggle="tooltip" title="fa fa-thermometer-empty"></i>
                                    <i className="fa fa-thermometer-full" data-bs-toggle="tooltip" title="fa fa-thermometer-full"></i>
                                    <i className="fa fa-thermometer-half" data-bs-toggle="tooltip" title="fa fa-thermometer-half"></i>
                                    <i className="fa fa-thermometer-quarter" data-bs-toggle="tooltip" title="fa fa-thermometer-quarter"></i>
                                    <i className="fa fa-thermometer-three-quarters" data-bs-toggle="tooltip" title="fa fa-thermometer-three-quarters"></i>
                                    <i className="fa fa-thumbs-down" data-bs-toggle="tooltip" title="fa fa-thumbs-down"></i>
                                    <i className="fa fa-thumbs-up" data-bs-toggle="tooltip" title="fa fa-thumbs-up"></i>
                                    <i className="fa fa-times" data-bs-toggle="tooltip" title="fa fa-times"></i>
                                    <i className="fa fa-times-circle" data-bs-toggle="tooltip" title="fa fa-times-circle"></i>
                                    <i className="fa fa-tint" data-bs-toggle="tooltip" title="fa fa-tint"></i>
                                    <i className="fa fa-toggle-off" data-bs-toggle="tooltip" title="fa fa-toggle-off"></i>
                                    <i className="fa fa-toggle-on" data-bs-toggle="tooltip" title="fa fa-toggle-on"></i>
                                    <i className="fa fa-trademark" data-bs-toggle="tooltip" title="fa fa-trademark"></i>
                                    <i className="fa fa-train" data-bs-toggle="tooltip" title="fa fa-train"></i>
                                    <i className="fa fa-transgender" data-bs-toggle="tooltip" title="fa fa-transgender"></i>
                                    <i className="fa fa-transgender-alt" data-bs-toggle="tooltip" title="fa fa-transgender-alt"></i>
                                    <i className="fa fa-trash" data-bs-toggle="tooltip" title="fa fa-trash"></i>
                                    <i className="fa fa-tree" data-bs-toggle="tooltip" title="fa fa-tree"></i>
                                    <i className="fa fa-trophy" data-bs-toggle="tooltip" title="fa fa-trophy"></i>
                                    <i className="fa fa-tty" data-bs-toggle="tooltip" title="fa fa-tty"></i>
                                    <i className="fa fa-tv" data-bs-toggle="tooltip" title="fa fa-tv"></i>
                                    <i className="fa fa-umbrella" data-bs-toggle="tooltip" title="fa fa-umbrella"></i>
                                    <i className="fa fa-underline" data-bs-toggle="tooltip" title="fa fa-underline"></i>
                                    <i className="fa fa-undo" data-bs-toggle="tooltip" title="fa fa-undo"></i>
                                    <i className="fa fa-universal-access" data-bs-toggle="tooltip" title="fa fa-universal-access"></i>
                                    <i className="fa fa-university" data-bs-toggle="tooltip" title="fa fa-university"></i>
                                    <i className="fa fa-unlink" data-bs-toggle="tooltip" title="fa fa-unlink"></i>
                                    <i className="fa fa-unlock" data-bs-toggle="tooltip" title="fa fa-unlock"></i>
                                    <i className="fa fa-unlock-alt" data-bs-toggle="tooltip" title="fa fa-unlock-alt"></i>
                                    <i className="fa fa-upload" data-bs-toggle="tooltip" title="fa fa-upload"></i>
                                    <i className="fa fa-user-circle" data-bs-toggle="tooltip" title="fa fa-user-circle"></i>
                                    <i className="fa fa-user-md" data-bs-toggle="tooltip" title="fa fa-user-md"></i>
                                    <i className="fa fa-user-plus" data-bs-toggle="tooltip" title="fa fa-user-plus"></i>
                                    <i className="fa fa-user-secret" data-bs-toggle="tooltip" title="fa fa-user-secret"></i>
                                    <i className="fa fa-user-times" data-bs-toggle="tooltip" title="fa fa-user-times"></i>
                                    <i className="fa fa-users" data-bs-toggle="tooltip" title="fa fa-users"></i>
                                    <i className="fa fa-venus" data-bs-toggle="tooltip" title="fa fa-venus"></i>
                                    <i className="fa fa-venus-double" data-bs-toggle="tooltip" title="fa fa-venus-double"></i>
                                    <i className="fa fa-venus-mars" data-bs-toggle="tooltip" title="fa fa-venus-mars"></i>
                                    <i className="fa fa-volume-down" data-bs-toggle="tooltip" title="fa fa-volume-down"></i>
                                    <i className="fa fa-volume-off" data-bs-toggle="tooltip" title="fa fa-volume-off"></i>
                                    <i className="fa fa-volume-up" data-bs-toggle="tooltip" title="fa fa-volume-up"></i>
                                    <i className="fa fa-wheelchair" data-bs-toggle="tooltip" title="fa fa-wheelchair"></i>
                                    <i className="fa fa-wifi" data-bs-toggle="tooltip" title="fa fa-wifi"></i>
                                    <i className="fa fa-window-close" data-bs-toggle="tooltip" title="fa fa-window-close"></i>
                                    <i className="fa fa-window-maximize" data-bs-toggle="tooltip" title="fa fa-window-maximize"></i>
                                    <i className="fa fa-window-minimize" data-bs-toggle="tooltip" title="fa fa-window-minimize"></i>
                                    <i className="fa fa-window-restore" data-bs-toggle="tooltip" title="fa fa-window-restore"></i>
                                    <i className="fa fa-wrench" data-bs-toggle="tooltip" title="fa fa-wrench"></i>
                                    <h4 className="card-title">Default Button</h4>
                                    <div className='uikit-design'>
                                        <button type="button" className="btn btn-primary me-1">Primary</button>
                                        <button type="button" className="btn btn-secondary me-1">Secondary</button>
                                        <button type="button" className="btn btn-success me-1">Success</button>
                                        <button type="button" className="btn btn-danger me-1">Danger</button>
                                        <button type="button" className="btn btn-warning me-1">Warning</button>
                                        <button type="button" className="btn btn-info me-1">Info</button>
                                        <button type="button" className="btn btn-light me-1">Light</button>
                                        <button type="button" className="btn btn-dark me-1">Dark</button>
                                        <button type="button" className="btn btn-link me-1">Link</button>
                                        <hr />
                                        <h4 className="card-title">Button Sizes</h4>
                                        <p>
                                            <button type="button" className="btn btn-primary btn-lg me-1">Primary</button>
                                            <button type="button" className="btn btn-secondary btn-lg me-1">Secondary</button>
                                            <button type="button" className="btn btn-success btn-lg me-1">Success</button>
                                            <button type="button" className="btn btn-danger btn-lg me-1">Danger</button>
                                            <button type="button" className="btn btn-warning btn-lg me-1">Warning</button>
                                            <button type="button" className="btn btn-info btn-lg me-1">Info</button>
                                            <button type="button" className="btn btn-light btn-lg me-1">Light</button>
                                            <button type="button" className="btn btn-dark btn-lg me-1">Dark</button>
                                        </p>
                                        <p>
                                            <button type="button" className="btn btn-primary me-1">Primary</button>
                                            <button type="button" className="btn btn-secondary me-1">Secondary</button>
                                            <button type="button" className="btn btn-success me-1">Success</button>
                                            <button type="button" className="btn btn-danger me-1">Danger</button>
                                            <button type="button" className="btn btn-warning me-1">Warning</button>
                                            <button type="button" className="btn btn-info me-1">Info</button>
                                            <button type="button" className="btn btn-light me-1">Light</button>
                                            <button type="button" className="btn btn-dark me-1">Dark</button>
                                        </p>
                                        <p>
                                            <button type="button" className="btn btn-primary btn-sm me-1">Primary</button>
                                            <button type="button" className="btn btn-secondary btn-sm me-1">Secondary</button>
                                            <button type="button" className="btn btn-success btn-sm me-1">Success</button>
                                            <button type="button" className="btn btn-danger btn-sm me-1">Danger</button>
                                            <button type="button" className="btn btn-warning btn-sm me-1">Warning</button>
                                            <button type="button" className="btn btn-info btn-sm me-1">Info</button>
                                            <button type="button" className="btn btn-light btn-sm me-1">Light</button>
                                            <button type="button" className="btn btn-dark btn-sm me-1">Dark</button>
                                        </p>
                                        <hr />
                                        <h4 className="card-title">Button Groups</h4>
                                        <br />
                                        <div className="btn-toolbar">
                                            <div className="btn-group btn-group-lg">
                                                <button type="button" className="btn btn-primary">Left</button>
                                                <button type="button" className="btn btn-primary">Middle</button>
                                                <button type="button" className="btn btn-primary">Right</button>
                                            </div>
                                        </div>
                                        <br />
                                        <div className="btn-toolbar">
                                            <div className="btn-group">
                                                <button type="button" className="btn btn-primary">Left</button>
                                                <button type="button" className="btn btn-primary">Middle</button>
                                                <button type="button" className="btn btn-primary">Right</button>
                                            </div>
                                        </div>
                                        <br />
                                        <div className="btn-toolbar">
                                            <div className="btn-group btn-group-sm">
                                                <button type="button" className="btn btn-primary">Left</button>
                                                <button type="button" className="btn btn-primary">Middle</button>
                                                <button type="button" className="btn btn-primary">Right</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-box">
                                    <h4 className="card-title">Alerts</h4>
                                    <div className="alert alert-warning alert-dismissible fade show" role="alert">
                                        <strong>Warning!</strong> There was a problem with your <Link to="#" className="alert-link">network connection</Link>.
                                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close">
                                            <span aria-hidden="true"> </span>
                                        </button>
                                    </div>
                                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                        <strong>Error!</strong> A <Link to="#" className="alert-link">problem</Link> has been occurred while submitting your data.
                                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close">
                                            <span aria-hidden="true"> </span>
                                        </button>
                                    </div>
                                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                                        <strong>Success!</strong> Your <Link to="#" className="alert-link">message</Link> has been sent successfully.
                                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close">
                                            <span aria-hidden="true"> </span>
                                        </button>
                                    </div>
                                    <div className="alert alert-info alert-dismissible fade show" role="alert">
                                        <strong>Note!</strong> Please read the <Link to="#" className="alert-link">comments</Link> carefully.
                                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close">
                                            <span aria-hidden="true"> </span>
                                        </button>
                                    </div>
                                </div>
                                <div className="card-box">
                                    <h4 className="card-title">Dropdowns within Text</h4>
                                    <div className="dropdown">
                                        <Link className="dropdown-toggle" to="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"> Dropdown </Link>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                        </div>
                                    </div>
                                    <hr />
                                    <h4 className="card-title">Dropdowns within Buttons</h4>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-primary dropdown-toggle me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Action</button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-secondary dropdown-toggle me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Action</button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-info dropdown-toggle me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Action</button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-success dropdown-toggle me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Action</button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-warning dropdown-toggle me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Action</button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-danger dropdown-toggle me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Action</button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <hr />
                                    <h4 className="card-title">Split button dropdowns</h4>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-primary">Action</button>
                                        <button type="button" className="btn btn-primary dropdown-toggle dropdown-toggle-split me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="sr-only">Toggle Dropdown</span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-secondary">Action</button>
                                        <button type="button" className="btn btn-secondary dropdown-toggle dropdown-toggle-split me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="sr-only">Toggle Dropdown</span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-info">Action</button>
                                        <button type="button" className="btn btn-info dropdown-toggle dropdown-toggle-split me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="sr-only">Toggle Dropdown</span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-success">Action</button>
                                        <button type="button" className="btn btn-success dropdown-toggle dropdown-toggle-split me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="sr-only">Toggle Dropdown</span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-warning">Action</button>
                                        <button type="button" className="btn btn-warning dropdown-toggle dropdown-toggle-split me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="sr-only">Toggle Dropdown</span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                    <div className="btn-group">
                                        <button type="button" className="btn btn-danger">Action</button>
                                        <button type="button" className="btn btn-danger dropdown-toggle dropdown-toggle-split me-1" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span className="sr-only">Toggle Dropdown</span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <Link className="dropdown-item" to="#">Action</Link>
                                            <Link className="dropdown-item" to="#">Another action</Link>
                                            <div className="dropdown-divider" />
                                            <Link className="dropdown-item" to="#">Separated link</Link>
                                        </div>
                                    </div>
                                </div>
                                <UiKit_Bar />
                            </div>
                        </div>
                    </div>
                </div>

            </>
        </>
    )
}

export default UiKit;
