"use strict";
(self["webpackChunkrenovation_tracker_web"] = self["webpackChunkrenovation_tracker_web"] || []).push([["main"],{

/***/ 92:
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AppComponent: () => (/* binding */ AppComponent)
/* harmony export */ });
/* harmony import */ var D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ 9204);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/forms */ 4456);
/* harmony import */ var _tape_bar_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tape-bar.component */ 6613);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _renovation_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./renovation.service */ 7000);








const _c0 = a0 => ({
  active: a0
});
const _c1 = (a0, a1) => ({
  "over-budget": a0,
  shake: a1
});
const _c2 = (a0, a1) => ({
  paused: a0,
  pending: a1
});
const _c3 = a0 => ({
  "over-budget": a0
});
const _c4 = () => [];
const _c5 = (a0, a1) => ({
  refunded: a0,
  paused: a1
});
const _c6 = a0 => ({
  "hint-zero": a0
});
const _c7 = (a0, a1) => ({
  "over-budget": a0,
  "negative": a1
});
function AppComponent_button_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "button", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_button_17_Template_button_click_0_listener() {
      const s_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r1).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.selectScenario(s_r2.key));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](1, "div", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const s_r2 = ctx.$implicit;
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction1"](3, _c0, ctx_r2.activeKey === s_r2.key));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](s_r2.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](s_r2.description);
  }
}
function AppComponent_section_18_span_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" (", ctx_r2.asNumber(ctx_r2.totalActual) >= ctx_r2.asNumber(ctx_r2.totalPlanned) ? "\u8D85\u652F" : "\u8282\u7EA6", " ", ctx_r2.diffMoney(ctx_r2.totalActual, ctx_r2.totalPlanned), ") ");
  }
}
function AppComponent_section_18_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "section", 17)(1, "div", 18)(2, "div", 19)(3, "div", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4, "\u603B\u8BA1\u5212\u9884\u7B97");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "div", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "div", 19)(8, "div", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](9, "\u603B\u5B9E\u9645\u652F\u51FA");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](10, "div", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](11);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](12, AppComponent_section_18_span_12_Template, 2, 2, "span", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](13, "div", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](14, "app-tape-bar", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](ctx_r2.fmtMoney(ctx_r2.totalPlanned));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction2"](6, _c1, ctx_r2.totalActual > ctx_r2.totalPlanned && ctx_r2.totalPlanned > 0, ctx_r2.triggerShake));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r2.fmtMoney(ctx_r2.totalActual), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r2.asNumber(ctx_r2.totalPlanned) > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("planned", ctx_r2.totalPlanned)("actual", ctx_r2.totalActual);
  }
}
function AppComponent_section_19_div_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 34)(1, "div", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "\u2795 \u65B0\u5EFA\u9636\u6BB5");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 36)(4, "label", 37)(5, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6, "\u9636\u6BB5\u540D\u79F0");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "input", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_7_Template_input_ngModelChange_7_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r5);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.newStage.name, $event) || (ctx_r2.newStage.name = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "label", 40)(9, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](10, "\u8BA1\u5212\u91D1\u989D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "input", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_7_Template_input_ngModelChange_11_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r5);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.newStage.planned_amount, $event) || (ctx_r2.newStage.planned_amount = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](12, "div", 42)(13, "button", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_7_Template_button_click_13_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r5);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.submitStage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](14, "\u4FDD\u5B58\u9636\u6BB5");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "button", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_7_Template_button_click_15_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r5);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.cancelStage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](16, "\u53D6\u6D88");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.newStage.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.newStage.planned_amount);
  }
}
function AppComponent_section_19_div_9_div_37_small_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "small", 85);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, "\uFF08\u8BA1\u5212\u4E3A 0\uFF09");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function AppComponent_section_19_div_9_div_37_small_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "small", 85);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, "\uFF08\u8D1F\u6570\u652F\u51FA\uFF09");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function AppComponent_section_19_div_9_div_37_span_14_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 86);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, "\u5DF2\u9000\u8D27");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function AppComponent_section_19_div_9_div_37_span_15_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 87);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, "\u5DF2\u652F\u4ED8");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function AppComponent_section_19_div_9_div_37_span_16_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 88);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, "\u672A\u652F\u4ED8");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function AppComponent_section_19_div_9_div_37_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 74)(1, "div", 75);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 76);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "div", 77);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](7, AppComponent_section_19_div_9_div_37_small_7_Template, 2, 0, "small", 78);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "div", 77);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](10, AppComponent_section_19_div_9_div_37_small_10_Template, 2, 0, "small", 78);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "div", 79);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](12);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](13, "div", 79);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](14, AppComponent_section_19_div_9_div_37_span_14_Template, 2, 0, "span", 80)(15, AppComponent_section_19_div_9_div_37_span_15_Template, 2, 0, "span", 81)(16, AppComponent_section_19_div_9_div_37_span_16_Template, 2, 0, "span", 82);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](17, "div", 83);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](18);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](19, "div", 84)(20, "button", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_div_37_Template_button_click_20_listener() {
      const e_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r8).$implicit;
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.startEditExpense(stage_r7, e_r9));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](21, "\u270E");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](22, "button", 55);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_div_37_Template_button_click_22_listener() {
      const e_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r8).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.removeExpense(e_r9));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](23, "\uD83D\uDDD1");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const e_r9 = ctx.$implicit;
    const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction2"](15, _c5, e_r9.refunded === 1, stage_r7.status === "paused"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](e_r9.item_name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](e_r9.category);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction1"](18, _c6, ctx_r2.asNumber(e_r9.planned_amount) === 0));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r2.fmtMoney(e_r9.planned_amount), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r2.asNumber(e_r9.planned_amount) === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction2"](20, _c7, ctx_r2.asNumber(e_r9.actual_amount) > ctx_r2.asNumber(e_r9.planned_amount) && ctx_r2.asNumber(e_r9.planned_amount) > 0, ctx_r2.asNumber(e_r9.actual_amount) < 0));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r2.fmtMoney(e_r9.actual_amount), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r2.asNumber(e_r9.actual_amount) < 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"]("", e_r9.quantity, " ", e_r9.unit, "");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", e_r9.refunded === 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", e_r9.paid === 1 && e_r9.refunded !== 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", e_r9.paid !== 1 && e_r9.refunded !== 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](e_r9.notes || "-");
  }
}
function AppComponent_section_19_div_9_div_105_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 89)(1, "div", 90);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "\u7F16\u8F91\u9636\u6BB5");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 91)(4, "label", 37)(5, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6, "\u540D\u79F0");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "input", 92);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_105_Template_input_ngModelChange_7_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r10);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingStage.name, $event) || (ctx_r2.editingStage.name = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "label", 40)(9, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](10, "\u8BA1\u5212\u91D1\u989D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "input", 93);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_105_Template_input_ngModelChange_11_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r10);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingStage.planned_amount, $event) || (ctx_r2.editingStage.planned_amount = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](12, "label", 40)(13, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](14, "\u72B6\u6001");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "select", 63);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_105_Template_select_ngModelChange_15_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r10);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingStage.status, $event) || (ctx_r2.editingStage.status = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](16, "option", 94);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](17, "\u8FDB\u884C\u4E2D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](18, "option", 95);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](19, "\u5DF2\u5B8C\u6210");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "option", 96);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](21, "\u5DF2\u505C\u5DE5");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](22, "option", 97);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](23, "\u672A\u5F00\u59CB");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](24, "div", 72)(25, "button", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_div_105_Template_button_click_25_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r10);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.submitEditStage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](26, "\u4FDD\u5B58");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](27, "button", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_div_105_Template_button_click_27_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r10);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.editingStageId = null);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](28, "\u53D6\u6D88");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingStage.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingStage.planned_amount);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingStage.status);
  }
}
function AppComponent_section_19_div_9_div_106_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 89)(1, "div", 90);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "\u7F16\u8F91\u5F00\u9500");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 91)(4, "label", 37)(5, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6, "\u9879\u76EE");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "input", 92);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_7_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.item_name, $event) || (ctx_r2.editingExpense.item_name = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "label", 40)(9, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](10, "\u8BA1\u5212\u91D1\u989D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "input", 93);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_11_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.planned_amount, $event) || (ctx_r2.editingExpense.planned_amount = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](12, "label", 40)(13, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](14, "\u5B9E\u9645\u91D1\u989D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "input", 93);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_15_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.actual_amount, $event) || (ctx_r2.editingExpense.actual_amount = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](16, "label", 64)(17, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](18, "\u6570\u91CF");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](19, "input", 93);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_19_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.quantity, $event) || (ctx_r2.editingExpense.quantity = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "label", 64)(21, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](22, "\u5355\u4F4D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](23, "input", 66);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_23_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.unit, $event) || (ctx_r2.editingExpense.unit = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](24, "label", 67)(25, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](26, "\u72B6\u6001");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](27, "span", 68)(28, "label", 69)(29, "input", 70);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_29_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.paid, $event) || (ctx_r2.editingExpense.paid = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](30, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](31, "\u5DF2\u652F\u4ED8");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](32, "label", 69)(33, "input", 70);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_33_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.refunded, $event) || (ctx_r2.editingExpense.refunded = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](34, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](35, "\u5DF2\u9000\u8D27");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](36, "label", 37)(37, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](38, "\u5907\u6CE8");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](39, "input", 92);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_div_106_Template_input_ngModelChange_39_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.editingExpense.notes, $event) || (ctx_r2.editingExpense.notes = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](40, "div", 72)(41, "button", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_div_106_Template_button_click_41_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.submitEditExpense());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](42, "\u4FDD\u5B58");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](43, "button", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_div_106_Template_button_click_43_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r11);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.editingExpenseId = null);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](44, "\u53D6\u6D88");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.item_name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.planned_amount);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.actual_amount);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.quantity);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.unit);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.paid);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.refunded);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.editingExpense.notes);
  }
}
function AppComponent_section_19_div_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 44)(1, "div", 45)(2, "div", 46)(3, "span", 47);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "span", 48);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "div", 49)(8, "span", 50);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](10, "span", 51);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](11, "/");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](12, "span", 52);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](13);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](14, "div", 53)(15, "button", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_Template_button_click_15_listener() {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.startEditStage(stage_r7));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](16, "\u270E");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](17, "button", 55);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_Template_button_click_17_listener() {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.removeStage(stage_r7));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](18, "\uD83D\uDDD1");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](19, "app-tape-bar", 56);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "div", 57)(21, "div", 58)(22, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](23, "\u9879\u76EE");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](24, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](25, "\u7C7B\u522B");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](26, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](27, "\u8BA1\u5212");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](28, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](29, "\u5B9E\u9645");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](30, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](31, "\u6570\u91CF");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](32, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](33, "\u72B6\u6001");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](34, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](35, "\u5907\u6CE8");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](36, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](37, AppComponent_section_19_div_9_div_37_Template, 24, 23, "div", 59);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](38, "div", 60)(39, "div", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](40, "\u2795 \u6DFB\u52A0\u4E00\u9879\u5F00\u9500");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](41, "div", 61)(42, "label", 37)(43, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](44, "\u9879\u76EE");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](45, "input", 62);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_45_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].item_name, $event) || (ctx_r2.expenseDrafts[stage_r7.id].item_name = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](46, "label", 40)(47, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](48, "\u7C7B\u522B");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](49, "select", 63);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_select_ngModelChange_49_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].category, $event) || (ctx_r2.expenseDrafts[stage_r7.id].category = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](50, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](51, "\u6750\u6599");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](52, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](53, "\u4EBA\u5DE5");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](54, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](55, "\u5B9A\u5236\u5BB6\u5177");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](56, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](57, "\u540A\u9876");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](58, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](59, "\u95E8\u7A97");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](60, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](61, "\u5BB6\u7535");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](62, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](63, "\u5E03\u827A");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](64, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](65, "\u706F\u5177");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](66, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](67, "\u88C5\u9970");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](68, "option");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](69, "\u5176\u4ED6");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](70, "label", 40)(71, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](72, "\u8BA1\u5212\u91D1\u989D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](73, "input", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_73_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].planned_amount, $event) || (ctx_r2.expenseDrafts[stage_r7.id].planned_amount = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](74, "label", 40)(75, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](76, "\u5B9E\u9645\u91D1\u989D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](77, "input", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_77_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].actual_amount, $event) || (ctx_r2.expenseDrafts[stage_r7.id].actual_amount = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](78, "label", 64)(79, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](80, "\u6570\u91CF");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](81, "input", 65);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_81_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].quantity, $event) || (ctx_r2.expenseDrafts[stage_r7.id].quantity = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](82, "label", 64)(83, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](84, "\u5355\u4F4D");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](85, "input", 66);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_85_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].unit, $event) || (ctx_r2.expenseDrafts[stage_r7.id].unit = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](86, "label", 67)(87, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](88, "\u72B6\u6001");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](89, "span", 68)(90, "label", 69)(91, "input", 70);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_91_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].paid, $event) || (ctx_r2.expenseDrafts[stage_r7.id].paid = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](92, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](93, "\u5DF2\u4ED8");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](94, "label", 69)(95, "input", 70);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_95_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].refunded, $event) || (ctx_r2.expenseDrafts[stage_r7.id].refunded = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](96, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](97, "\u9000\u8D27");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](98, "label", 37)(99, "span", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](100, "\u5907\u6CE8");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](101, "input", 71);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayListener"]("ngModelChange", function AppComponent_section_19_div_9_Template_input_ngModelChange_101_listener($event) {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayBindingSet"](ctx_r2.expenseDrafts[stage_r7.id].notes, $event) || (ctx_r2.expenseDrafts[stage_r7.id].notes = $event);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"]($event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](102, "div", 72)(103, "button", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_div_9_Template_button_click_103_listener() {
      const stage_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r6).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.submitExpense(stage_r7));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](104, "\u6DFB\u52A0\u5230\u672C\u9636\u6BB5");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](105, AppComponent_section_19_div_9_div_105_Template, 29, 3, "div", 73)(106, AppComponent_section_19_div_9_div_106_Template, 45, 8, "div", 73);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const stage_r7 = ctx.$implicit;
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction2"](21, _c2, stage_r7.status === "paused", stage_r7.status === "pending"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](stage_r7.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", "status-" + stage_r7.status);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r2.statusText(stage_r7.status), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"]("\u8BA1\u5212 ", ctx_r2.fmtMoney(stage_r7.planned_amount), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction1"](24, _c3, ctx_r2.asNumber(stage_r7.actual_amount) > ctx_r2.asNumber(stage_r7.planned_amount) && ctx_r2.asNumber(stage_r7.planned_amount) > 0));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" \u5B9E\u9645 ", ctx_r2.fmtMoney(stage_r7.actual_amount), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("planned", stage_r7.planned_amount)("actual", stage_r7.actual_amount);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](18);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r2.expensesByStage[stage_r7.id] || _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction0"](26, _c4));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].item_name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].category);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](24);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].planned_amount);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].actual_amount);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].quantity);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].unit);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].paid);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].refunded);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtwoWayProperty"]("ngModel", ctx_r2.expenseDrafts[stage_r7.id].notes);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r2.editingStageId === stage_r7.id);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r2.editingExpenseId && ctx_r2.editingExpense.stage_id === stage_r7.id);
  }
}
function AppComponent_section_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "section", 27)(1, "div", 28)(2, "h2");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](4, "div", 29)(5, "button", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_section_19_Template_button_click_5_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r4);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r2.startAddStage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6, " + \u65B0\u589E\u5927\u9636\u6BB5 ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](7, AppComponent_section_19_div_7_Template, 17, 2, "div", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "div", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](9, AppComponent_section_19_div_9_Template, 107, 27, "div", 33);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](ctx_r2.detail.scenario.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r2.showStageForm);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r2.detail.stages);
  }
}
function fmtMoney(v) {
  const n = Number(v);
  if (!isFinite(n) || isNaN(n)) return '¥0.00';
  return '¥' + n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
class AppComponent {
  constructor(service) {
    this.service = service;
    this.scenarios = [];
    this.detail = null;
    this.activeKey = null;
    this.expenseDrafts = {};
    this.expensesByStage = {};
    this.showStageForm = false;
    this.newStage = {
      name: '',
      planned_amount: 0
    };
    this.editingStageId = null;
    this.editingStage = {};
    this.editingExpenseId = null;
    this.editingExpense = {};
    this.triggerShake = false;
    this.shakeTimer = null;
    this.fmtMoney = fmtMoney;
  }
  asNumber(v) {
    const n = Number(v);
    if (!isFinite(n) || isNaN(n)) return 0;
    return n;
  }
  abs(v) {
    const n = this.asNumber(v);
    return n < 0 ? -n : n;
  }
  diffMoney(a, b) {
    return fmtMoney(this.abs(this.asNumber(a) - this.asNumber(b)));
  }
  statusText(s) {
    return {
      done: '已完成',
      active: '进行中',
      paused: '已停工',
      pending: '未开始'
    }[s] || s;
  }
  get totalPlanned() {
    return (this.detail?.stages || []).reduce((sum, s) => sum + Number(s.planned_amount || 0), 0);
  }
  get totalActual() {
    return (this.detail?.stages || []).reduce((sum, s) => sum + Number(s.actual_amount || 0), 0);
  }
  ngOnInit() {
    var _this = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      yield _this.loadList();
    })();
  }
  ngOnDestroy() {
    if (this.shakeTimer) clearTimeout(this.shakeTimer);
  }
  loadList() {
    var _this2 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      try {
        _this2.scenarios = yield _this2.service.listScenarios();
      } catch (e) {
        _this2.scenarios = [];
      }
      if (_this2.scenarios.length > 0 && !_this2.activeKey) {
        _this2.selectScenario(_this2.scenarios[0].key);
      }
    })();
  }
  selectScenario(key) {
    var _this3 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      _this3.activeKey = key;
      try {
        const d = yield _this3.service.getScenario(key);
        _this3.detail = d;
        _this3.rebuildExpenseIndex();
        _this3.shakeIfOverBudget();
      } catch (e) {
        console.error(e);
      }
    })();
  }
  reseed() {
    var _this4 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      try {
        yield _this4.service.reseed();
      } catch (e) {}
      yield _this4.loadList();
      if (_this4.activeKey) {
        _this4.selectScenario(_this4.activeKey);
      }
    })();
  }
  rebuildExpenseIndex() {
    this.expensesByStage = {};
    for (const s of this.detail?.stages || []) {
      this.expensesByStage[s.id] = [];
      if (!this.expenseDrafts[s.id]) {
        this.expenseDrafts[s.id] = this.emptyExpense();
      }
    }
    for (const e of this.detail?.expenses || []) {
      if (!this.expensesByStage[e.stage_id]) this.expensesByStage[e.stage_id] = [];
      this.expensesByStage[e.stage_id].push(e);
    }
  }
  emptyExpense() {
    return {
      item_name: '',
      category: '材料',
      planned_amount: 0,
      actual_amount: 0,
      quantity: 1,
      unit: '项',
      paid: 0,
      refunded: 0,
      notes: ''
    };
  }
  shakeIfOverBudget() {
    if (this.totalPlanned > 0 && this.totalActual > this.totalPlanned) {
      this.triggerShake = false;
      if (this.shakeTimer) clearTimeout(this.shakeTimer);
      this.shakeTimer = setTimeout(() => {
        this.triggerShake = true;
      }, 50);
    }
  }
  startAddStage() {
    this.showStageForm = true;
    this.newStage = {
      name: '',
      planned_amount: 0
    };
  }
  cancelStage() {
    this.showStageForm = false;
  }
  submitStage() {
    var _this5 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      if (!_this5.activeKey || !_this5.newStage.name) return;
      try {
        yield _this5.service.addStage(_this5.activeKey, {
          name: _this5.newStage.name,
          planned_amount: Number(_this5.newStage.planned_amount) || 0
        });
      } catch (e) {}
      _this5.showStageForm = false;
      _this5.selectScenario(_this5.activeKey);
    })();
  }
  startEditStage(stage) {
    this.editingStageId = stage.id;
    this.editingStage = {
      ...stage
    };
    this.editingExpenseId = null;
  }
  submitEditStage() {
    var _this6 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      try {
        yield _this6.service.updateStage(_this6.editingStage.id, {
          name: _this6.editingStage.name,
          planned_amount: Number(_this6.editingStage.planned_amount) || 0,
          status: _this6.editingStage.status
        });
      } catch (e) {}
      _this6.editingStageId = null;
      _this6.selectScenario(_this6.activeKey);
    })();
  }
  removeStage(stage) {
    var _this7 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      if (!confirm(`删除阶段「${stage.name}」及其全部开销？`)) return;
      try {
        yield _this7.service.deleteStage(stage.id);
      } catch (e) {}
      _this7.selectScenario(_this7.activeKey);
    })();
  }
  submitExpense(stage) {
    var _this8 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      const draft = _this8.expenseDrafts[stage.id];
      if (!draft || !String(draft.item_name).trim()) return;
      const payload = {
        item_name: draft.item_name,
        category: draft.category,
        planned_amount: Number(draft.planned_amount) || 0,
        actual_amount: Number(draft.actual_amount) || 0,
        quantity: Number(draft.quantity) || 1,
        unit: draft.unit || '项',
        paid: draft.paid ? 1 : 0,
        refunded: draft.refunded ? 1 : 0,
        notes: draft.notes || ''
      };
      try {
        yield _this8.service.addExpense(stage.id, payload);
      } catch (e) {}
      _this8.expenseDrafts[stage.id] = _this8.emptyExpense();
      _this8.selectScenario(_this8.activeKey);
    })();
  }
  startEditExpense(stage, e) {
    this.editingExpenseId = e.id;
    this.editingExpense = {
      ...e
    };
    this.editingStageId = null;
  }
  submitEditExpense() {
    var _this9 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      const payload = {
        item_name: _this9.editingExpense.item_name,
        category: _this9.editingExpense.category,
        planned_amount: Number(_this9.editingExpense.planned_amount) || 0,
        actual_amount: Number(_this9.editingExpense.actual_amount) || 0,
        quantity: Number(_this9.editingExpense.quantity) || 1,
        unit: _this9.editingExpense.unit || '项',
        paid: _this9.editingExpense.paid ? 1 : 0,
        refunded: _this9.editingExpense.refunded ? 1 : 0,
        notes: _this9.editingExpense.notes || ''
      };
      try {
        yield _this9.service.updateExpense(_this9.editingExpense.id, payload);
      } catch (e) {}
      _this9.editingExpenseId = null;
      _this9.selectScenario(_this9.activeKey);
    })();
  }
  removeExpense(e) {
    var _this0 = this;
    return (0,D_Github_TRAE_Home_Renovation_Tracker_web_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      if (!confirm(`删除开销「${e.item_name}」？`)) return;
      try {
        yield _this0.service.deleteExpense(e.id);
      } catch (err) {}
      _this0.selectScenario(_this0.activeKey);
    })();
  }
  static {
    this.ɵfac = function AppComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || AppComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_renovation_service__WEBPACK_IMPORTED_MODULE_2__.RenovationService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
      type: AppComponent,
      selectors: [["app-root"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵStandaloneFeature"]],
      decls: 26,
      vars: 3,
      consts: [[1, "app-shell"], [1, "app-header"], [1, "brand"], [1, "logo"], [1, "subtitle"], [1, "header-actions"], [1, "btn", "btn-secondary", 3, "click"], [1, "scenario-strip"], [1, "section-title"], [1, "scenario-cards"], ["class", "scenario-card", 3, "ngClass", "click", 4, "ngFor", "ngForOf"], ["class", "summary", 4, "ngIf"], ["class", "builder", 4, "ngIf"], [1, "app-footer"], [1, "scenario-card", 3, "click", "ngClass"], [1, "scenario-name"], [1, "scenario-desc"], [1, "summary"], [1, "summary-grid"], [1, "summary-card"], [1, "summary-label"], [1, "summary-amount"], [1, "summary-amount", 3, "ngClass"], ["class", "diff", 4, "ngIf"], [1, "summary-card", "tape-card"], ["label", "\u603B\u9884\u7B97\u4F7F\u7528\u7387", 3, "planned", "actual"], [1, "diff"], [1, "builder"], [1, "builder-head"], [1, "builder-actions"], [1, "btn", "btn-primary", 3, "click"], ["class", "stage-add", 4, "ngIf"], [1, "stages"], ["class", "stage", 3, "ngClass", 4, "ngFor", "ngForOf"], [1, "stage-add"], [1, "add-expense-title"], [1, "stage-add-body"], [1, "field", "field-wide"], [1, "field-label"], ["type", "text", "placeholder", "\u5982\uFF1A\u6C34\u7535 / \u6CE5\u74E6 / \u6728\u5DE5", 3, "ngModelChange", "ngModel"], [1, "field"], ["type", "number", "step", "0.01", "placeholder", "0", 3, "ngModelChange", "ngModel"], [1, "field", "field-submit", 2, "justify-content", "flex-start"], [1, "btn", "btn-ghost", 3, "click"], [1, "stage", 3, "ngClass"], [1, "stage-head"], [1, "stage-title"], [1, "stage-name"], [1, "stage-status", 3, "ngClass"], [1, "stage-amounts"], [1, "planned"], [1, "divider"], [1, "actual", 3, "ngClass"], [1, "stage-actions"], ["title", "\u7F16\u8F91", 1, "icon-btn", 3, "click"], ["title", "\u5220\u9664", 1, "icon-btn", 3, "click"], ["label", "\u9636\u6BB5\u8FDB\u5EA6", 3, "planned", "actual"], [1, "expenses"], [1, "expenses-head"], ["class", "expense-row", 3, "ngClass", 4, "ngFor", "ngForOf"], [1, "add-expense-card"], [1, "add-expense-grid"], ["type", "text", "placeholder", "\u5982\uFF1A\u7535\u7EBF / \u6C34\u7BA1 / \u74F7\u7816", 3, "ngModelChange", "ngModel"], [3, "ngModelChange", "ngModel"], [1, "field", "field-tight"], ["type", "number", "step", "1", "placeholder", "1", 3, "ngModelChange", "ngModel"], ["type", "text", "placeholder", "\u9879/\u5957/m\u00B2", 3, "ngModelChange", "ngModel"], [1, "field", "field-checks"], [1, "checks"], [1, "chk"], ["type", "checkbox", 3, "ngModelChange", "ngModel"], ["type", "text", "placeholder", "\u9009\u586B", 3, "ngModelChange", "ngModel"], [1, "field", "field-submit"], ["class", "stage-edit", 4, "ngIf"], [1, "expense-row", 3, "ngClass"], [1, "col", "col-item"], [1, "col", "col-cat"], [1, "col", "col-money", 3, "ngClass"], ["class", "hint", 4, "ngIf"], [1, "col"], ["class", "tag tag-refund", 4, "ngIf"], ["class", "tag tag-paid", 4, "ngIf"], ["class", "tag tag-unpaid", 4, "ngIf"], [1, "col", "muted"], [1, "col", "col-actions"], [1, "hint"], [1, "tag", "tag-refund"], [1, "tag", "tag-paid"], [1, "tag", "tag-unpaid"], [1, "stage-edit"], [1, "edit-title"], [1, "edit-grid"], ["type", "text", 3, "ngModelChange", "ngModel"], ["type", "number", "step", "0.01", 3, "ngModelChange", "ngModel"], ["value", "active"], ["value", "done"], ["value", "paused"], ["value", "pending"]],
      template: function AppComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 0)(1, "header", 1)(2, "div", 2)(3, "div", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4, "\uD83E\uDDF0");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "div")(6, "h1");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](7, "\u88C5\u4FEE\u8BB0\u8D26\u672C");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "p", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](9, "Angular + Fastify + SQLite \u00B7 \u9884\u7B97\u4E0E\u652F\u51FA\u4E00\u76EE\u4E86\u7136");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](10, "div", 5)(11, "button", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function AppComponent_Template_button_click_11_listener() {
            return ctx.reseed();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](12, " \uD83D\uDD04 \u91CD\u65B0\u751F\u6210\u6F14\u793A\u6570\u636E ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](13, "section", 7)(14, "h2", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](15, "\u4E00\u952E\u4F53\u9A8C\u573A\u666F");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](16, "div", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](17, AppComponent_button_17_Template, 5, 5, "button", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](18, AppComponent_section_18_Template, 15, 9, "section", 11)(19, AppComponent_section_19_Template, 10, 3, "section", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "footer", 13)(21, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](22, "\u6570\u636E\u4FDD\u5B58\u5728\u672C\u5730 SQLite\uFF08");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](23, "code");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](24, "server/renovation.db");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](25, "\uFF09\u3002");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](17);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx.scenarios);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.detail);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.detail);
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_4__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgClass, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgForOf, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgIf, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgSelectOption, _angular_forms__WEBPACK_IMPORTED_MODULE_5__["ɵNgSelectMultipleOption"], _angular_forms__WEBPACK_IMPORTED_MODULE_5__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NumberValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.CheckboxControlValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.SelectControlValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgModel, _tape_bar_component__WEBPACK_IMPORTED_MODULE_1__.TapeBarComponent],
      styles: [".app-shell[_ngcontent-%COMP%] {\n        max-width: 1200px;\n        margin: 0 auto;\n        padding: 24px;\n      }\n      .app-header[_ngcontent-%COMP%] {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        margin-bottom: 16px;\n      }\n      .brand[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n        gap: 14px;\n      }\n      .logo[_ngcontent-%COMP%] {\n        width: 56px;\n        height: 56px;\n        border-radius: 14px;\n        background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-size: 30px;\n      }\n      h1[_ngcontent-%COMP%] {\n        margin: 0;\n        font-size: 22px;\n      }\n      .subtitle[_ngcontent-%COMP%] {\n        margin: 4px 0 0;\n        color: var(--color-muted);\n        font-size: 12px;\n      }\n      .section-title[_ngcontent-%COMP%] {\n        font-size: 14px;\n        color: var(--color-muted);\n        margin: 12px 0;\n        font-weight: 600;\n        text-transform: uppercase;\n        letter-spacing: 0.5px;\n      }\n      .scenario-strip[_ngcontent-%COMP%] {\n        margin-bottom: 24px;\n      }\n      .scenario-cards[_ngcontent-%COMP%] {\n        display: grid;\n        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n        gap: 12px;\n      }\n      .scenario-card[_ngcontent-%COMP%] {\n        text-align: left;\n        background: var(--color-surface);\n        border: 2px solid var(--color-border);\n        border-radius: 12px;\n        padding: 14px 16px;\n        transition: all 0.2s;\n      }\n      .scenario-card[_ngcontent-%COMP%]:hover {\n        transform: translateY(-2px);\n        border-color: var(--color-primary);\n        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);\n      }\n      .scenario-card.active[_ngcontent-%COMP%] {\n        border-color: var(--color-primary);\n        background: var(--color-primary-soft);\n      }\n      .scenario-name[_ngcontent-%COMP%] {\n        font-weight: 700;\n        margin-bottom: 4px;\n      }\n      .scenario-desc[_ngcontent-%COMP%] {\n        font-size: 12px;\n        color: var(--color-muted);\n        line-height: 1.4;\n      }\n      .summary[_ngcontent-%COMP%] {\n        margin-bottom: 20px;\n      }\n      .summary-grid[_ngcontent-%COMP%] {\n        display: grid;\n        grid-template-columns: 1fr 1.3fr 1.3fr;\n        gap: 12px;\n      }\n      @media (max-width: 760px) {\n        .summary-grid[_ngcontent-%COMP%] {\n          grid-template-columns: 1fr;\n        }\n      }\n      .summary-card[_ngcontent-%COMP%] {\n        background: var(--color-surface);\n        border: 1px solid var(--color-border);\n        border-radius: 12px;\n        padding: 16px 20px;\n      }\n      .tape-card[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n      }\n      .summary-label[_ngcontent-%COMP%] {\n        color: var(--color-muted);\n        font-size: 12px;\n        margin-bottom: 6px;\n      }\n      .summary-amount[_ngcontent-%COMP%] {\n        font-size: 22px;\n        font-weight: 700;\n        font-variant-numeric: tabular-nums;\n      }\n      .summary-amount[_ngcontent-%COMP%]   .diff[_ngcontent-%COMP%] {\n        font-size: 12px;\n        font-weight: 500;\n        color: var(--color-muted);\n        margin-left: 6px;\n      }\n      .summary-amount.over-budget[_ngcontent-%COMP%] {\n        color: var(--color-danger);\n      }\n      .summary-amount.shake[_ngcontent-%COMP%] {\n        animation: shake 0.5s ease-in-out;\n      }\n      .builder[_ngcontent-%COMP%] {\n        background: var(--color-surface);\n        border: 1px solid var(--color-border);\n        border-radius: 12px;\n        padding: 20px;\n        margin-bottom: 24px;\n      }\n      .builder-head[_ngcontent-%COMP%] {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        margin-bottom: 12px;\n      }\n      .builder-head[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n        margin: 0;\n        font-size: 18px;\n      }\n      .stage-add[_ngcontent-%COMP%], .stage-edit[_ngcontent-%COMP%] {\n        background: #f9fafb;\n        border: 1px dashed #d1d5db;\n        border-radius: 12px;\n        padding: 14px 16px;\n        margin: 12px 0;\n      }\n      .edit-title[_ngcontent-%COMP%], \n   .add-expense-title[_ngcontent-%COMP%] {\n        font-size: 13px;\n        font-weight: 700;\n        color: #374151;\n        margin-bottom: 10px;\n        letter-spacing: 0.3px;\n      }\n      .add-expense-grid[_ngcontent-%COMP%], \n   .edit-grid[_ngcontent-%COMP%], \n   .stage-add-body[_ngcontent-%COMP%] {\n        display: grid;\n        grid-template-columns: repeat(4, minmax(0, 1fr));\n        gap: 10px 14px;\n        align-items: end;\n      }\n      @media (max-width: 960px) {\n        .add-expense-grid[_ngcontent-%COMP%], .edit-grid[_ngcontent-%COMP%], .stage-add-body[_ngcontent-%COMP%] {\n          grid-template-columns: repeat(2, minmax(0, 1fr));\n        }\n      }\n      @media (max-width: 520px) {\n        .add-expense-grid[_ngcontent-%COMP%], .edit-grid[_ngcontent-%COMP%], .stage-add-body[_ngcontent-%COMP%] {\n          grid-template-columns: 1fr;\n        }\n      }\n      .field[_ngcontent-%COMP%] {\n        display: flex;\n        flex-direction: column;\n        gap: 6px;\n        min-width: 0;\n      }\n      .field-label[_ngcontent-%COMP%] {\n        font-size: 11px;\n        font-weight: 600;\n        color: #6b7280;\n        letter-spacing: 0.3px;\n      }\n      .field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%], \n   .field[_ngcontent-%COMP%]   select[_ngcontent-%COMP%] {\n        width: 100%;\n        box-sizing: border-box;\n        padding: 8px 10px;\n        border: 1px solid #d1d5db;\n        border-radius: 8px;\n        background: white;\n        font-size: 13px;\n        color: #111827;\n        transition: border-color 0.15s, box-shadow 0.15s;\n      }\n      .field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]:focus, \n   .field[_ngcontent-%COMP%]   select[_ngcontent-%COMP%]:focus {\n        outline: none;\n        border-color: #2563eb;\n        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);\n      }\n      .field-wide[_ngcontent-%COMP%] {\n        grid-column: span 2;\n      }\n      @media (max-width: 520px) {\n        .field-wide[_ngcontent-%COMP%] { grid-column: span 1; }\n      }\n      .field-tight[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n        min-width: 0;\n      }\n      .field-checks[_ngcontent-%COMP%]   .checks[_ngcontent-%COMP%] {\n        display: flex;\n        gap: 10px;\n        align-items: center;\n        height: 34px;\n        padding: 0 4px;\n        background: white;\n        border: 1px solid #d1d5db;\n        border-radius: 8px;\n      }\n      .chk[_ngcontent-%COMP%] {\n        display: inline-flex;\n        align-items: center;\n        gap: 6px;\n        font-size: 12px;\n        color: #374151;\n        cursor: pointer;\n        -webkit-user-select: none;\n                user-select: none;\n      }\n      .chk[_ngcontent-%COMP%]   input[type=\"checkbox\"][_ngcontent-%COMP%] {\n        width: 14px;\n        height: 14px;\n        accent-color: #2563eb;\n        margin: 0;\n      }\n      .field-submit[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n        gap: 8px;\n        padding-bottom: 0;\n        justify-content: flex-end;\n      }\n      .stage-add-actions[_ngcontent-%COMP%] {\n        display: flex;\n        gap: 8px;\n        margin-top: 2px;\n      }\n      .stages[_ngcontent-%COMP%] {\n        display: grid;\n        gap: 16px;\n      }\n      .stage[_ngcontent-%COMP%] {\n        background: #fff;\n        border: 1px solid var(--color-border);\n        border-radius: 14px;\n        padding: 18px 20px;\n        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);\n      }\n      .stage.paused[_ngcontent-%COMP%] {\n        border-left: 4px solid var(--color-warning);\n        background: #fffbeb;\n      }\n      .stage.pending[_ngcontent-%COMP%] {\n        opacity: 0.85;\n        background: #f8fafc;\n      }\n      .stage-head[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n        gap: 12px;\n        margin-bottom: 14px;\n        flex-wrap: wrap;\n      }\n      .stage-title[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n        gap: 10px;\n      }\n      .stage-name[_ngcontent-%COMP%] {\n        font-weight: 700;\n        font-size: 17px;\n        color: #111827;\n      }\n      .stage-status[_ngcontent-%COMP%] {\n        font-size: 11px;\n        padding: 3px 10px;\n        border-radius: 999px;\n        background: #e5e7eb;\n        color: #374151;\n        font-weight: 600;\n        letter-spacing: 0.3px;\n      }\n      .status-done[_ngcontent-%COMP%] { background: #dcfce7; color: #166534; }\n      .status-active[_ngcontent-%COMP%] { background: #dbeafe; color: #1e3a8a; }\n      .status-paused[_ngcontent-%COMP%] { background: #fef3c7; color: #78350f; }\n      .status-pending[_ngcontent-%COMP%] { background: #e5e7eb; color: #374151; }\n      .stage-amounts[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n        gap: 8px;\n        font-size: 13px;\n        color: #475569;\n        margin-left: 6px;\n      }\n      .stage-amounts[_ngcontent-%COMP%]   .planned[_ngcontent-%COMP%] { color: #6b7280; }\n      .stage-amounts[_ngcontent-%COMP%]   .divider[_ngcontent-%COMP%] { color: #d1d5db; }\n      .stage-amounts[_ngcontent-%COMP%]   .actual[_ngcontent-%COMP%] {\n        font-weight: 700;\n        color: #111827;\n      }\n      .stage-amounts[_ngcontent-%COMP%]   .actual.over-budget[_ngcontent-%COMP%] {\n        color: var(--color-danger);\n      }\n      .stage-actions[_ngcontent-%COMP%] {\n        margin-left: auto;\n        display: flex;\n        gap: 4px;\n      }\n      .icon-btn[_ngcontent-%COMP%] {\n        background: transparent;\n        border: 1px solid #e5e7eb;\n        border-radius: 8px;\n        padding: 6px 10px;\n        font-size: 12px;\n        color: #374151;\n        cursor: pointer;\n        transition: background 0.15s, border-color 0.15s;\n      }\n      .icon-btn[_ngcontent-%COMP%]:hover {\n        background: #f3f4f6;\n        border-color: #cbd5f5;\n      }\n      .expenses[_ngcontent-%COMP%] {\n        margin-top: 14px;\n      }\n      .expenses-head[_ngcontent-%COMP%] {\n        display: grid;\n        grid-template-columns: 1.8fr 0.9fr 1.1fr 1.1fr 1fr 1fr 1.2fr 110px;\n        gap: 10px;\n        padding: 8px 10px;\n        font-size: 11px;\n        font-weight: 700;\n        color: #6b7280;\n        text-transform: uppercase;\n        letter-spacing: 0.4px;\n        border-bottom: 1px solid #e5e7eb;\n        background: #f9fafb;\n        border-radius: 8px 8px 0 0;\n      }\n      @media (max-width: 960px) {\n        .expenses-head[_ngcontent-%COMP%] { display: none; }\n      }\n      .expense-row[_ngcontent-%COMP%] {\n        display: grid;\n        grid-template-columns: 1.8fr 0.9fr 1.1fr 1.1fr 1fr 1fr 1.2fr 110px;\n        gap: 10px;\n        padding: 12px 10px;\n        border-bottom: 1px solid #f1f5f9;\n        align-items: center;\n        font-size: 13px;\n        color: #111827;\n        transition: background 0.15s;\n      }\n      .expense-row[_ngcontent-%COMP%]:hover {\n        background: #f9fafb;\n      }\n      @media (max-width: 960px) {\n        .expense-row[_ngcontent-%COMP%] {\n          grid-template-columns: 1fr 1fr;\n          row-gap: 4px;\n          padding: 14px 12px;\n        }\n        .expense-row[_ngcontent-%COMP%]   .col-actions[_ngcontent-%COMP%] {\n          grid-column: 1 / -1;\n          justify-content: flex-start;\n        }\n      }\n      .expense-row.refunded[_ngcontent-%COMP%] {\n        color: #7c3aed;\n        text-decoration: line-through;\n        background: #faf5ff;\n      }\n      .expense-row.paused[_ngcontent-%COMP%] {\n        color: #78350f;\n      }\n      .expense-row[_ngcontent-%COMP%]   .col[_ngcontent-%COMP%] {\n        min-width: 0;\n      }\n      .col-item[_ngcontent-%COMP%] {\n        font-weight: 600;\n      }\n      .col-money[_ngcontent-%COMP%] {\n        font-variant-numeric: tabular-nums;\n        font-weight: 600;\n        color: #111827;\n        display: flex;\n        flex-direction: column;\n        gap: 2px;\n      }\n      .col-money.over-budget[_ngcontent-%COMP%] { color: var(--color-danger); }\n      .col-money.negative[_ngcontent-%COMP%] { color: var(--color-warning); }\n      .col-money.hint-zero[_ngcontent-%COMP%] { color: #6b7280; font-weight: 500; }\n      .col-actions[_ngcontent-%COMP%] {\n        display: flex;\n        gap: 4px;\n        justify-content: flex-end;\n      }\n      .add-expense-card[_ngcontent-%COMP%] {\n        margin-top: 14px;\n        padding: 14px 16px 16px;\n        background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);\n        border: 1px solid #bfdbfe;\n        border-radius: 12px;\n      }\n      .tag[_ngcontent-%COMP%] {\n        display: inline-block;\n        font-size: 11px;\n        padding: 2px 8px;\n        border-radius: 999px;\n        margin-right: 4px;\n      }\n      .tag-paid[_ngcontent-%COMP%] { background: #dcfce7; color: #166534; }\n      .tag-unpaid[_ngcontent-%COMP%] { background: #f3f4f6; color: #6b7280; }\n      .tag-refund[_ngcontent-%COMP%] { background: #ede9fe; color: #5b21b6; }\n      .muted[_ngcontent-%COMP%] { color: var(--color-muted); }\n      .text-right[_ngcontent-%COMP%] { text-align: right; }\n      .hint[_ngcontent-%COMP%] {\n        display: block;\n        color: var(--color-warning);\n        font-size: 11px;\n        margin-top: 2px;\n      }\n      .hint-zero[_ngcontent-%COMP%] {\n        color: var(--color-muted);\n      }\n      .negative[_ngcontent-%COMP%] {\n        color: var(--color-warning);\n        font-weight: 600;\n      }\n      .chk[_ngcontent-%COMP%] {\n        display: inline-flex;\n        align-items: center;\n        gap: 4px;\n        font-size: 12px;\n        color: var(--color-text);\n      }\n      .btn[_ngcontent-%COMP%] {\n        border: 1px solid transparent;\n        border-radius: 6px;\n        padding: 6px 12px;\n        font-size: 13px;\n        font-weight: 600;\n        transition: all 0.15s;\n      }\n      .btn-primary[_ngcontent-%COMP%] {\n        background: var(--color-primary);\n        color: white;\n      }\n      .btn-primary[_ngcontent-%COMP%]:hover { background: #1d4ed8; }\n      .btn-secondary[_ngcontent-%COMP%] {\n        background: white;\n        border-color: #d1d5db;\n      }\n      .btn-secondary[_ngcontent-%COMP%]:hover { background: #f3f4f6; }\n      .btn-ghost[_ngcontent-%COMP%] {\n        background: transparent;\n        border-color: #d1d5db;\n        color: #6b7280;\n      }\n      .btn-ghost[_ngcontent-%COMP%]:hover { background: #f3f4f6; }\n      .app-footer[_ngcontent-%COMP%] {\n        color: var(--color-muted);\n        font-size: 12px;\n        text-align: center;\n        margin-top: 20px;\n      }\n      .app-footer[_ngcontent-%COMP%]   code[_ngcontent-%COMP%] {\n        background: #f3f4f6;\n        padding: 1px 6px;\n        border-radius: 4px;\n      }\n    \n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYXBwLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO01BQ007UUFDRSxpQkFBaUI7UUFDakIsY0FBYztRQUNkLGFBQWE7TUFDZjtNQUNBO1FBQ0UsYUFBYTtRQUNiLDhCQUE4QjtRQUM5QixtQkFBbUI7UUFDbkIsbUJBQW1CO01BQ3JCO01BQ0E7UUFDRSxhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLFNBQVM7TUFDWDtNQUNBO1FBQ0UsV0FBVztRQUNYLFlBQVk7UUFDWixtQkFBbUI7UUFDbkIscURBQXFEO1FBQ3JELGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsdUJBQXVCO1FBQ3ZCLGVBQWU7TUFDakI7TUFDQTtRQUNFLFNBQVM7UUFDVCxlQUFlO01BQ2pCO01BQ0E7UUFDRSxlQUFlO1FBQ2YseUJBQXlCO1FBQ3pCLGVBQWU7TUFDakI7TUFDQTtRQUNFLGVBQWU7UUFDZix5QkFBeUI7UUFDekIsY0FBYztRQUNkLGdCQUFnQjtRQUNoQix5QkFBeUI7UUFDekIscUJBQXFCO01BQ3ZCO01BQ0E7UUFDRSxtQkFBbUI7TUFDckI7TUFDQTtRQUNFLGFBQWE7UUFDYiwyREFBMkQ7UUFDM0QsU0FBUztNQUNYO01BQ0E7UUFDRSxnQkFBZ0I7UUFDaEIsZ0NBQWdDO1FBQ2hDLHFDQUFxQztRQUNyQyxtQkFBbUI7UUFDbkIsa0JBQWtCO1FBQ2xCLG9CQUFvQjtNQUN0QjtNQUNBO1FBQ0UsMkJBQTJCO1FBQzNCLGtDQUFrQztRQUNsQyw4Q0FBOEM7TUFDaEQ7TUFDQTtRQUNFLGtDQUFrQztRQUNsQyxxQ0FBcUM7TUFDdkM7TUFDQTtRQUNFLGdCQUFnQjtRQUNoQixrQkFBa0I7TUFDcEI7TUFDQTtRQUNFLGVBQWU7UUFDZix5QkFBeUI7UUFDekIsZ0JBQWdCO01BQ2xCO01BQ0E7UUFDRSxtQkFBbUI7TUFDckI7TUFDQTtRQUNFLGFBQWE7UUFDYixzQ0FBc0M7UUFDdEMsU0FBUztNQUNYO01BQ0E7UUFDRTtVQUNFLDBCQUEwQjtRQUM1QjtNQUNGO01BQ0E7UUFDRSxnQ0FBZ0M7UUFDaEMscUNBQXFDO1FBQ3JDLG1CQUFtQjtRQUNuQixrQkFBa0I7TUFDcEI7TUFDQTtRQUNFLGFBQWE7UUFDYixtQkFBbUI7TUFDckI7TUFDQTtRQUNFLHlCQUF5QjtRQUN6QixlQUFlO1FBQ2Ysa0JBQWtCO01BQ3BCO01BQ0E7UUFDRSxlQUFlO1FBQ2YsZ0JBQWdCO1FBQ2hCLGtDQUFrQztNQUNwQztNQUNBO1FBQ0UsZUFBZTtRQUNmLGdCQUFnQjtRQUNoQix5QkFBeUI7UUFDekIsZ0JBQWdCO01BQ2xCO01BQ0E7UUFDRSwwQkFBMEI7TUFDNUI7TUFDQTtRQUNFLGlDQUFpQztNQUNuQztNQUNBO1FBQ0UsZ0NBQWdDO1FBQ2hDLHFDQUFxQztRQUNyQyxtQkFBbUI7UUFDbkIsYUFBYTtRQUNiLG1CQUFtQjtNQUNyQjtNQUNBO1FBQ0UsYUFBYTtRQUNiLDhCQUE4QjtRQUM5QixtQkFBbUI7UUFDbkIsbUJBQW1CO01BQ3JCO01BQ0E7UUFDRSxTQUFTO1FBQ1QsZUFBZTtNQUNqQjtNQUNBO1FBQ0UsbUJBQW1CO1FBQ25CLDBCQUEwQjtRQUMxQixtQkFBbUI7UUFDbkIsa0JBQWtCO1FBQ2xCLGNBQWM7TUFDaEI7TUFDQTs7UUFFRSxlQUFlO1FBQ2YsZ0JBQWdCO1FBQ2hCLGNBQWM7UUFDZCxtQkFBbUI7UUFDbkIscUJBQXFCO01BQ3ZCO01BQ0E7OztRQUdFLGFBQWE7UUFDYixnREFBZ0Q7UUFDaEQsY0FBYztRQUNkLGdCQUFnQjtNQUNsQjtNQUNBO1FBQ0U7VUFDRSxnREFBZ0Q7UUFDbEQ7TUFDRjtNQUNBO1FBQ0U7VUFDRSwwQkFBMEI7UUFDNUI7TUFDRjtNQUNBO1FBQ0UsYUFBYTtRQUNiLHNCQUFzQjtRQUN0QixRQUFRO1FBQ1IsWUFBWTtNQUNkO01BQ0E7UUFDRSxlQUFlO1FBQ2YsZ0JBQWdCO1FBQ2hCLGNBQWM7UUFDZCxxQkFBcUI7TUFDdkI7TUFDQTs7UUFFRSxXQUFXO1FBQ1gsc0JBQXNCO1FBQ3RCLGlCQUFpQjtRQUNqQix5QkFBeUI7UUFDekIsa0JBQWtCO1FBQ2xCLGlCQUFpQjtRQUNqQixlQUFlO1FBQ2YsY0FBYztRQUNkLGdEQUFnRDtNQUNsRDtNQUNBOztRQUVFLGFBQWE7UUFDYixxQkFBcUI7UUFDckIsNkNBQTZDO01BQy9DO01BQ0E7UUFDRSxtQkFBbUI7TUFDckI7TUFDQTtRQUNFLGNBQWMsbUJBQW1CLEVBQUU7TUFDckM7TUFDQTtRQUNFLFlBQVk7TUFDZDtNQUNBO1FBQ0UsYUFBYTtRQUNiLFNBQVM7UUFDVCxtQkFBbUI7UUFDbkIsWUFBWTtRQUNaLGNBQWM7UUFDZCxpQkFBaUI7UUFDakIseUJBQXlCO1FBQ3pCLGtCQUFrQjtNQUNwQjtNQUNBO1FBQ0Usb0JBQW9CO1FBQ3BCLG1CQUFtQjtRQUNuQixRQUFRO1FBQ1IsZUFBZTtRQUNmLGNBQWM7UUFDZCxlQUFlO1FBQ2YseUJBQWlCO2dCQUFqQixpQkFBaUI7TUFDbkI7TUFDQTtRQUNFLFdBQVc7UUFDWCxZQUFZO1FBQ1oscUJBQXFCO1FBQ3JCLFNBQVM7TUFDWDtNQUNBO1FBQ0UsYUFBYTtRQUNiLG1CQUFtQjtRQUNuQixRQUFRO1FBQ1IsaUJBQWlCO1FBQ2pCLHlCQUF5QjtNQUMzQjtNQUNBO1FBQ0UsYUFBYTtRQUNiLFFBQVE7UUFDUixlQUFlO01BQ2pCO01BQ0E7UUFDRSxhQUFhO1FBQ2IsU0FBUztNQUNYO01BQ0E7UUFDRSxnQkFBZ0I7UUFDaEIscUNBQXFDO1FBQ3JDLG1CQUFtQjtRQUNuQixrQkFBa0I7UUFDbEIsNENBQTRDO01BQzlDO01BQ0E7UUFDRSwyQ0FBMkM7UUFDM0MsbUJBQW1CO01BQ3JCO01BQ0E7UUFDRSxhQUFhO1FBQ2IsbUJBQW1CO01BQ3JCO01BQ0E7UUFDRSxhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLFNBQVM7UUFDVCxtQkFBbUI7UUFDbkIsZUFBZTtNQUNqQjtNQUNBO1FBQ0UsYUFBYTtRQUNiLG1CQUFtQjtRQUNuQixTQUFTO01BQ1g7TUFDQTtRQUNFLGdCQUFnQjtRQUNoQixlQUFlO1FBQ2YsY0FBYztNQUNoQjtNQUNBO1FBQ0UsZUFBZTtRQUNmLGlCQUFpQjtRQUNqQixvQkFBb0I7UUFDcEIsbUJBQW1CO1FBQ25CLGNBQWM7UUFDZCxnQkFBZ0I7UUFDaEIscUJBQXFCO01BQ3ZCO01BQ0EsZUFBZSxtQkFBbUIsRUFBRSxjQUFjLEVBQUU7TUFDcEQsaUJBQWlCLG1CQUFtQixFQUFFLGNBQWMsRUFBRTtNQUN0RCxpQkFBaUIsbUJBQW1CLEVBQUUsY0FBYyxFQUFFO01BQ3RELGtCQUFrQixtQkFBbUIsRUFBRSxjQUFjLEVBQUU7TUFDdkQ7UUFDRSxhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLFFBQVE7UUFDUixlQUFlO1FBQ2YsY0FBYztRQUNkLGdCQUFnQjtNQUNsQjtNQUNBLDBCQUEwQixjQUFjLEVBQUU7TUFDMUMsMEJBQTBCLGNBQWMsRUFBRTtNQUMxQztRQUNFLGdCQUFnQjtRQUNoQixjQUFjO01BQ2hCO01BQ0E7UUFDRSwwQkFBMEI7TUFDNUI7TUFDQTtRQUNFLGlCQUFpQjtRQUNqQixhQUFhO1FBQ2IsUUFBUTtNQUNWO01BQ0E7UUFDRSx1QkFBdUI7UUFDdkIseUJBQXlCO1FBQ3pCLGtCQUFrQjtRQUNsQixpQkFBaUI7UUFDakIsZUFBZTtRQUNmLGNBQWM7UUFDZCxlQUFlO1FBQ2YsZ0RBQWdEO01BQ2xEO01BQ0E7UUFDRSxtQkFBbUI7UUFDbkIscUJBQXFCO01BQ3ZCO01BQ0E7UUFDRSxnQkFBZ0I7TUFDbEI7TUFDQTtRQUNFLGFBQWE7UUFDYixrRUFBa0U7UUFDbEUsU0FBUztRQUNULGlCQUFpQjtRQUNqQixlQUFlO1FBQ2YsZ0JBQWdCO1FBQ2hCLGNBQWM7UUFDZCx5QkFBeUI7UUFDekIscUJBQXFCO1FBQ3JCLGdDQUFnQztRQUNoQyxtQkFBbUI7UUFDbkIsMEJBQTBCO01BQzVCO01BQ0E7UUFDRSxpQkFBaUIsYUFBYSxFQUFFO01BQ2xDO01BQ0E7UUFDRSxhQUFhO1FBQ2Isa0VBQWtFO1FBQ2xFLFNBQVM7UUFDVCxrQkFBa0I7UUFDbEIsZ0NBQWdDO1FBQ2hDLG1CQUFtQjtRQUNuQixlQUFlO1FBQ2YsY0FBYztRQUNkLDRCQUE0QjtNQUM5QjtNQUNBO1FBQ0UsbUJBQW1CO01BQ3JCO01BQ0E7UUFDRTtVQUNFLDhCQUE4QjtVQUM5QixZQUFZO1VBQ1osa0JBQWtCO1FBQ3BCO1FBQ0E7VUFDRSxtQkFBbUI7VUFDbkIsMkJBQTJCO1FBQzdCO01BQ0Y7TUFDQTtRQUNFLGNBQWM7UUFDZCw2QkFBNkI7UUFDN0IsbUJBQW1CO01BQ3JCO01BQ0E7UUFDRSxjQUFjO01BQ2hCO01BQ0E7UUFDRSxZQUFZO01BQ2Q7TUFDQTtRQUNFLGdCQUFnQjtNQUNsQjtNQUNBO1FBQ0Usa0NBQWtDO1FBQ2xDLGdCQUFnQjtRQUNoQixjQUFjO1FBQ2QsYUFBYTtRQUNiLHNCQUFzQjtRQUN0QixRQUFRO01BQ1Y7TUFDQSx5QkFBeUIsMEJBQTBCLEVBQUU7TUFDckQsc0JBQXNCLDJCQUEyQixFQUFFO01BQ25ELHVCQUF1QixjQUFjLEVBQUUsZ0JBQWdCLEVBQUU7TUFDekQ7UUFDRSxhQUFhO1FBQ2IsUUFBUTtRQUNSLHlCQUF5QjtNQUMzQjtNQUNBO1FBQ0UsZ0JBQWdCO1FBQ2hCLHVCQUF1QjtRQUN2Qiw2REFBNkQ7UUFDN0QseUJBQXlCO1FBQ3pCLG1CQUFtQjtNQUNyQjtNQUNBO1FBQ0UscUJBQXFCO1FBQ3JCLGVBQWU7UUFDZixnQkFBZ0I7UUFDaEIsb0JBQW9CO1FBQ3BCLGlCQUFpQjtNQUNuQjtNQUNBLFlBQVksbUJBQW1CLEVBQUUsY0FBYyxFQUFFO01BQ2pELGNBQWMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFO01BQ25ELGNBQWMsbUJBQW1CLEVBQUUsY0FBYyxFQUFFO01BQ25ELFNBQVMseUJBQXlCLEVBQUU7TUFDcEMsY0FBYyxpQkFBaUIsRUFBRTtNQUNqQztRQUNFLGNBQWM7UUFDZCwyQkFBMkI7UUFDM0IsZUFBZTtRQUNmLGVBQWU7TUFDakI7TUFDQTtRQUNFLHlCQUF5QjtNQUMzQjtNQUNBO1FBQ0UsMkJBQTJCO1FBQzNCLGdCQUFnQjtNQUNsQjtNQUNBO1FBQ0Usb0JBQW9CO1FBQ3BCLG1CQUFtQjtRQUNuQixRQUFRO1FBQ1IsZUFBZTtRQUNmLHdCQUF3QjtNQUMxQjtNQUNBO1FBQ0UsNkJBQTZCO1FBQzdCLGtCQUFrQjtRQUNsQixpQkFBaUI7UUFDakIsZUFBZTtRQUNmLGdCQUFnQjtRQUNoQixxQkFBcUI7TUFDdkI7TUFDQTtRQUNFLGdDQUFnQztRQUNoQyxZQUFZO01BQ2Q7TUFDQSxxQkFBcUIsbUJBQW1CLEVBQUU7TUFDMUM7UUFDRSxpQkFBaUI7UUFDakIscUJBQXFCO01BQ3ZCO01BQ0EsdUJBQXVCLG1CQUFtQixFQUFFO01BQzVDO1FBQ0UsdUJBQXVCO1FBQ3ZCLHFCQUFxQjtRQUNyQixjQUFjO01BQ2hCO01BQ0EsbUJBQW1CLG1CQUFtQixFQUFFO01BQ3hDO1FBQ0UseUJBQXlCO1FBQ3pCLGVBQWU7UUFDZixrQkFBa0I7UUFDbEIsZ0JBQWdCO01BQ2xCO01BQ0E7UUFDRSxtQkFBbUI7UUFDbkIsZ0JBQWdCO1FBQ2hCLGtCQUFrQjtNQUNwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuICAgICAgLmFwcC1zaGVsbCB7XG4gICAgICAgIG1heC13aWR0aDogMTIwMHB4O1xuICAgICAgICBtYXJnaW46IDAgYXV0bztcbiAgICAgICAgcGFkZGluZzogMjRweDtcbiAgICAgIH1cbiAgICAgIC5hcHAtaGVhZGVyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAxNnB4O1xuICAgICAgfVxuICAgICAgLmJyYW5kIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiAxNHB4O1xuICAgICAgfVxuICAgICAgLmxvZ28ge1xuICAgICAgICB3aWR0aDogNTZweDtcbiAgICAgICAgaGVpZ2h0OiA1NnB4O1xuICAgICAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjM2I4MmY2LCAjOGI1Y2Y2KTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGZvbnQtc2l6ZTogMzBweDtcbiAgICAgIH1cbiAgICAgIGgxIHtcbiAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICBmb250LXNpemU6IDIycHg7XG4gICAgICB9XG4gICAgICAuc3VidGl0bGUge1xuICAgICAgICBtYXJnaW46IDRweCAwIDA7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci1tdXRlZCk7XG4gICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgIH1cbiAgICAgIC5zZWN0aW9uLXRpdGxlIHtcbiAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICBjb2xvcjogdmFyKC0tY29sb3ItbXV0ZWQpO1xuICAgICAgICBtYXJnaW46IDEycHggMDtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuNXB4O1xuICAgICAgfVxuICAgICAgLnNjZW5hcmlvLXN0cmlwIHtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMjRweDtcbiAgICAgIH1cbiAgICAgIC5zY2VuYXJpby1jYXJkcyB7XG4gICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMjAwcHgsIDFmcikpO1xuICAgICAgICBnYXA6IDEycHg7XG4gICAgICB9XG4gICAgICAuc2NlbmFyaW8tY2FyZCB7XG4gICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgICAgIGJhY2tncm91bmQ6IHZhcigtLWNvbG9yLXN1cmZhY2UpO1xuICAgICAgICBib3JkZXI6IDJweCBzb2xpZCB2YXIoLS1jb2xvci1ib3JkZXIpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgICAgICBwYWRkaW5nOiAxNHB4IDE2cHg7XG4gICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjJzO1xuICAgICAgfVxuICAgICAgLnNjZW5hcmlvLWNhcmQ6aG92ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTJweCk7XG4gICAgICAgIGJvcmRlci1jb2xvcjogdmFyKC0tY29sb3ItcHJpbWFyeSk7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSgzNywgOTksIDIzNSwgMC4xMik7XG4gICAgICB9XG4gICAgICAuc2NlbmFyaW8tY2FyZC5hY3RpdmUge1xuICAgICAgICBib3JkZXItY29sb3I6IHZhcigtLWNvbG9yLXByaW1hcnkpO1xuICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1jb2xvci1wcmltYXJ5LXNvZnQpO1xuICAgICAgfVxuICAgICAgLnNjZW5hcmlvLW5hbWUge1xuICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiA0cHg7XG4gICAgICB9XG4gICAgICAuc2NlbmFyaW8tZGVzYyB7XG4gICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLW11dGVkKTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDtcbiAgICAgIH1cbiAgICAgIC5zdW1tYXJ5IHtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMjBweDtcbiAgICAgIH1cbiAgICAgIC5zdW1tYXJ5LWdyaWQge1xuICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxLjNmciAxLjNmcjtcbiAgICAgICAgZ2FwOiAxMnB4O1xuICAgICAgfVxuICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDc2MHB4KSB7XG4gICAgICAgIC5zdW1tYXJ5LWdyaWQge1xuICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAuc3VtbWFyeS1jYXJkIHtcbiAgICAgICAgYmFja2dyb3VuZDogdmFyKC0tY29sb3Itc3VyZmFjZSk7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWNvbG9yLWJvcmRlcik7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgIHBhZGRpbmc6IDE2cHggMjBweDtcbiAgICAgIH1cbiAgICAgIC50YXBlLWNhcmQge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgfVxuICAgICAgLnN1bW1hcnktbGFiZWwge1xuICAgICAgICBjb2xvcjogdmFyKC0tY29sb3ItbXV0ZWQpO1xuICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDZweDtcbiAgICAgIH1cbiAgICAgIC5zdW1tYXJ5LWFtb3VudCB7XG4gICAgICAgIGZvbnQtc2l6ZTogMjJweDtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtcztcbiAgICAgIH1cbiAgICAgIC5zdW1tYXJ5LWFtb3VudCAuZGlmZiB7XG4gICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLW11dGVkKTtcbiAgICAgICAgbWFyZ2luLWxlZnQ6IDZweDtcbiAgICAgIH1cbiAgICAgIC5zdW1tYXJ5LWFtb3VudC5vdmVyLWJ1ZGdldCB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci1kYW5nZXIpO1xuICAgICAgfVxuICAgICAgLnN1bW1hcnktYW1vdW50LnNoYWtlIHtcbiAgICAgICAgYW5pbWF0aW9uOiBzaGFrZSAwLjVzIGVhc2UtaW4tb3V0O1xuICAgICAgfVxuICAgICAgLmJ1aWxkZXIge1xuICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1jb2xvci1zdXJmYWNlKTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tY29sb3ItYm9yZGVyKTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMjRweDtcbiAgICAgIH1cbiAgICAgIC5idWlsZGVyLWhlYWQge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDEycHg7XG4gICAgICB9XG4gICAgICAuYnVpbGRlci1oZWFkIGgyIHtcbiAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICBmb250LXNpemU6IDE4cHg7XG4gICAgICB9XG4gICAgICAuc3RhZ2UtYWRkLCAuc3RhZ2UtZWRpdCB7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmOWZhZmI7XG4gICAgICAgIGJvcmRlcjogMXB4IGRhc2hlZCAjZDFkNWRiO1xuICAgICAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgICAgICBwYWRkaW5nOiAxNHB4IDE2cHg7XG4gICAgICAgIG1hcmdpbjogMTJweCAwO1xuICAgICAgfVxuICAgICAgLmVkaXQtdGl0bGUsXG4gICAgICAuYWRkLWV4cGVuc2UtdGl0bGUge1xuICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgIGNvbG9yOiAjMzc0MTUxO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICAgICAgICBsZXR0ZXItc3BhY2luZzogMC4zcHg7XG4gICAgICB9XG4gICAgICAuYWRkLWV4cGVuc2UtZ3JpZCxcbiAgICAgIC5lZGl0LWdyaWQsXG4gICAgICAuc3RhZ2UtYWRkLWJvZHkge1xuICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCg0LCBtaW5tYXgoMCwgMWZyKSk7XG4gICAgICAgIGdhcDogMTBweCAxNHB4O1xuICAgICAgICBhbGlnbi1pdGVtczogZW5kO1xuICAgICAgfVxuICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDk2MHB4KSB7XG4gICAgICAgIC5hZGQtZXhwZW5zZS1ncmlkLCAuZWRpdC1ncmlkLCAuc3RhZ2UtYWRkLWJvZHkge1xuICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDIsIG1pbm1heCgwLCAxZnIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDUyMHB4KSB7XG4gICAgICAgIC5hZGQtZXhwZW5zZS1ncmlkLCAuZWRpdC1ncmlkLCAuc3RhZ2UtYWRkLWJvZHkge1xuICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAuZmllbGQge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgfVxuICAgICAgLmZpZWxkLWxhYmVsIHtcbiAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICBjb2xvcjogIzZiNzI4MDtcbiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgfVxuICAgICAgLmZpZWxkIGlucHV0LFxuICAgICAgLmZpZWxkIHNlbGVjdCB7XG4gICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICBwYWRkaW5nOiA4cHggMTBweDtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2QxZDVkYjtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICBjb2xvcjogIzExMTgyNztcbiAgICAgICAgdHJhbnNpdGlvbjogYm9yZGVyLWNvbG9yIDAuMTVzLCBib3gtc2hhZG93IDAuMTVzO1xuICAgICAgfVxuICAgICAgLmZpZWxkIGlucHV0OmZvY3VzLFxuICAgICAgLmZpZWxkIHNlbGVjdDpmb2N1cyB7XG4gICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgIGJvcmRlci1jb2xvcjogIzI1NjNlYjtcbiAgICAgICAgYm94LXNoYWRvdzogMCAwIDAgM3B4IHJnYmEoMzcsIDk5LCAyMzUsIDAuMTUpO1xuICAgICAgfVxuICAgICAgLmZpZWxkLXdpZGUge1xuICAgICAgICBncmlkLWNvbHVtbjogc3BhbiAyO1xuICAgICAgfVxuICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDUyMHB4KSB7XG4gICAgICAgIC5maWVsZC13aWRlIHsgZ3JpZC1jb2x1bW46IHNwYW4gMTsgfVxuICAgICAgfVxuICAgICAgLmZpZWxkLXRpZ2h0IGlucHV0IHtcbiAgICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgfVxuICAgICAgLmZpZWxkLWNoZWNrcyAuY2hlY2tzIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBoZWlnaHQ6IDM0cHg7XG4gICAgICAgIHBhZGRpbmc6IDAgNHB4O1xuICAgICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2QxZDVkYjtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgfVxuICAgICAgLmNoayB7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICBjb2xvcjogIzM3NDE1MTtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgIH1cbiAgICAgIC5jaGsgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdIHtcbiAgICAgICAgd2lkdGg6IDE0cHg7XG4gICAgICAgIGhlaWdodDogMTRweDtcbiAgICAgICAgYWNjZW50LWNvbG9yOiAjMjU2M2ViO1xuICAgICAgICBtYXJnaW46IDA7XG4gICAgICB9XG4gICAgICAuZmllbGQtc3VibWl0IHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiAwO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgfVxuICAgICAgLnN0YWdlLWFkZC1hY3Rpb25zIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIG1hcmdpbi10b3A6IDJweDtcbiAgICAgIH1cbiAgICAgIC5zdGFnZXMge1xuICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICBnYXA6IDE2cHg7XG4gICAgICB9XG4gICAgICAuc3RhZ2Uge1xuICAgICAgICBiYWNrZ3JvdW5kOiAjZmZmO1xuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1jb2xvci1ib3JkZXIpO1xuICAgICAgICBib3JkZXItcmFkaXVzOiAxNHB4O1xuICAgICAgICBwYWRkaW5nOiAxOHB4IDIwcHg7XG4gICAgICAgIGJveC1zaGFkb3c6IDAgMXB4IDJweCByZ2JhKDE1LCAyMywgNDIsIDAuMDQpO1xuICAgICAgfVxuICAgICAgLnN0YWdlLnBhdXNlZCB7XG4gICAgICAgIGJvcmRlci1sZWZ0OiA0cHggc29saWQgdmFyKC0tY29sb3Itd2FybmluZyk7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmZmZiZWI7XG4gICAgICB9XG4gICAgICAuc3RhZ2UucGVuZGluZyB7XG4gICAgICAgIG9wYWNpdHk6IDAuODU7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmOGZhZmM7XG4gICAgICB9XG4gICAgICAuc3RhZ2UtaGVhZCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogMTJweDtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogMTRweDtcbiAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgfVxuICAgICAgLnN0YWdlLXRpdGxlIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgfVxuICAgICAgLnN0YWdlLW5hbWUge1xuICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICBmb250LXNpemU6IDE3cHg7XG4gICAgICAgIGNvbG9yOiAjMTExODI3O1xuICAgICAgfVxuICAgICAgLnN0YWdlLXN0YXR1cyB7XG4gICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgcGFkZGluZzogM3B4IDEwcHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICAgICAgICBiYWNrZ3JvdW5kOiAjZTVlN2ViO1xuICAgICAgICBjb2xvcjogIzM3NDE1MTtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuM3B4O1xuICAgICAgfVxuICAgICAgLnN0YXR1cy1kb25lIHsgYmFja2dyb3VuZDogI2RjZmNlNzsgY29sb3I6ICMxNjY1MzQ7IH1cbiAgICAgIC5zdGF0dXMtYWN0aXZlIHsgYmFja2dyb3VuZDogI2RiZWFmZTsgY29sb3I6ICMxZTNhOGE7IH1cbiAgICAgIC5zdGF0dXMtcGF1c2VkIHsgYmFja2dyb3VuZDogI2ZlZjNjNzsgY29sb3I6ICM3ODM1MGY7IH1cbiAgICAgIC5zdGF0dXMtcGVuZGluZyB7IGJhY2tncm91bmQ6ICNlNWU3ZWI7IGNvbG9yOiAjMzc0MTUxOyB9XG4gICAgICAuc3RhZ2UtYW1vdW50cyB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogOHB4O1xuICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgIGNvbG9yOiAjNDc1NTY5O1xuICAgICAgICBtYXJnaW4tbGVmdDogNnB4O1xuICAgICAgfVxuICAgICAgLnN0YWdlLWFtb3VudHMgLnBsYW5uZWQgeyBjb2xvcjogIzZiNzI4MDsgfVxuICAgICAgLnN0YWdlLWFtb3VudHMgLmRpdmlkZXIgeyBjb2xvcjogI2QxZDVkYjsgfVxuICAgICAgLnN0YWdlLWFtb3VudHMgLmFjdHVhbCB7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgIGNvbG9yOiAjMTExODI3O1xuICAgICAgfVxuICAgICAgLnN0YWdlLWFtb3VudHMgLmFjdHVhbC5vdmVyLWJ1ZGdldCB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci1kYW5nZXIpO1xuICAgICAgfVxuICAgICAgLnN0YWdlLWFjdGlvbnMge1xuICAgICAgICBtYXJnaW4tbGVmdDogYXV0bztcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZ2FwOiA0cHg7XG4gICAgICB9XG4gICAgICAuaWNvbi1idG4ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2U1ZTdlYjtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgICBwYWRkaW5nOiA2cHggMTBweDtcbiAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICBjb2xvcjogIzM3NDE1MTtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMTVzLCBib3JkZXItY29sb3IgMC4xNXM7XG4gICAgICB9XG4gICAgICAuaWNvbi1idG46aG92ZXIge1xuICAgICAgICBiYWNrZ3JvdW5kOiAjZjNmNGY2O1xuICAgICAgICBib3JkZXItY29sb3I6ICNjYmQ1ZjU7XG4gICAgICB9XG4gICAgICAuZXhwZW5zZXMge1xuICAgICAgICBtYXJnaW4tdG9wOiAxNHB4O1xuICAgICAgfVxuICAgICAgLmV4cGVuc2VzLWhlYWQge1xuICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDEuOGZyIDAuOWZyIDEuMWZyIDEuMWZyIDFmciAxZnIgMS4yZnIgMTEwcHg7XG4gICAgICAgIGdhcDogMTBweDtcbiAgICAgICAgcGFkZGluZzogOHB4IDEwcHg7XG4gICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgY29sb3I6ICM2YjcyODA7XG4gICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgICAgIGxldHRlci1zcGFjaW5nOiAwLjRweDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlNWU3ZWI7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmOWZhZmI7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDhweCA4cHggMCAwO1xuICAgICAgfVxuICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDk2MHB4KSB7XG4gICAgICAgIC5leHBlbnNlcy1oZWFkIHsgZGlzcGxheTogbm9uZTsgfVxuICAgICAgfVxuICAgICAgLmV4cGVuc2Utcm93IHtcbiAgICAgICAgZGlzcGxheTogZ3JpZDtcbiAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxLjhmciAwLjlmciAxLjFmciAxLjFmciAxZnIgMWZyIDEuMmZyIDExMHB4O1xuICAgICAgICBnYXA6IDEwcHg7XG4gICAgICAgIHBhZGRpbmc6IDEycHggMTBweDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNmMWY1Zjk7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgICAgY29sb3I6ICMxMTE4Mjc7XG4gICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXM7XG4gICAgICB9XG4gICAgICAuZXhwZW5zZS1yb3c6aG92ZXIge1xuICAgICAgICBiYWNrZ3JvdW5kOiAjZjlmYWZiO1xuICAgICAgfVxuICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDk2MHB4KSB7XG4gICAgICAgIC5leHBlbnNlLXJvdyB7XG4gICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyO1xuICAgICAgICAgIHJvdy1nYXA6IDRweDtcbiAgICAgICAgICBwYWRkaW5nOiAxNHB4IDEycHg7XG4gICAgICAgIH1cbiAgICAgICAgLmV4cGVuc2Utcm93IC5jb2wtYWN0aW9ucyB7XG4gICAgICAgICAgZ3JpZC1jb2x1bW46IDEgLyAtMTtcbiAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC5leHBlbnNlLXJvdy5yZWZ1bmRlZCB7XG4gICAgICAgIGNvbG9yOiAjN2MzYWVkO1xuICAgICAgICB0ZXh0LWRlY29yYXRpb246IGxpbmUtdGhyb3VnaDtcbiAgICAgICAgYmFja2dyb3VuZDogI2ZhZjVmZjtcbiAgICAgIH1cbiAgICAgIC5leHBlbnNlLXJvdy5wYXVzZWQge1xuICAgICAgICBjb2xvcjogIzc4MzUwZjtcbiAgICAgIH1cbiAgICAgIC5leHBlbnNlLXJvdyAuY29sIHtcbiAgICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgfVxuICAgICAgLmNvbC1pdGVtIHtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgIH1cbiAgICAgIC5jb2wtbW9uZXkge1xuICAgICAgICBmb250LXZhcmlhbnQtbnVtZXJpYzogdGFidWxhci1udW1zO1xuICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICBjb2xvcjogIzExMTgyNztcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgZ2FwOiAycHg7XG4gICAgICB9XG4gICAgICAuY29sLW1vbmV5Lm92ZXItYnVkZ2V0IHsgY29sb3I6IHZhcigtLWNvbG9yLWRhbmdlcik7IH1cbiAgICAgIC5jb2wtbW9uZXkubmVnYXRpdmUgeyBjb2xvcjogdmFyKC0tY29sb3Itd2FybmluZyk7IH1cbiAgICAgIC5jb2wtbW9uZXkuaGludC16ZXJvIHsgY29sb3I6ICM2YjcyODA7IGZvbnQtd2VpZ2h0OiA1MDA7IH1cbiAgICAgIC5jb2wtYWN0aW9ucyB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGdhcDogNHB4O1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgfVxuICAgICAgLmFkZC1leHBlbnNlLWNhcmQge1xuICAgICAgICBtYXJnaW4tdG9wOiAxNHB4O1xuICAgICAgICBwYWRkaW5nOiAxNHB4IDE2cHggMTZweDtcbiAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDE4MGRlZywgI2VmZjZmZiAwJSwgI2Y4ZmFmYyAxMDAlKTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2JmZGJmZTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgIH1cbiAgICAgIC50YWcge1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgcGFkZGluZzogMnB4IDhweDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgICAgIG1hcmdpbi1yaWdodDogNHB4O1xuICAgICAgfVxuICAgICAgLnRhZy1wYWlkIHsgYmFja2dyb3VuZDogI2RjZmNlNzsgY29sb3I6ICMxNjY1MzQ7IH1cbiAgICAgIC50YWctdW5wYWlkIHsgYmFja2dyb3VuZDogI2YzZjRmNjsgY29sb3I6ICM2YjcyODA7IH1cbiAgICAgIC50YWctcmVmdW5kIHsgYmFja2dyb3VuZDogI2VkZTlmZTsgY29sb3I6ICM1YjIxYjY7IH1cbiAgICAgIC5tdXRlZCB7IGNvbG9yOiB2YXIoLS1jb2xvci1tdXRlZCk7IH1cbiAgICAgIC50ZXh0LXJpZ2h0IHsgdGV4dC1hbGlnbjogcmlnaHQ7IH1cbiAgICAgIC5oaW50IHtcbiAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci13YXJuaW5nKTtcbiAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICB9XG4gICAgICAuaGludC16ZXJvIHtcbiAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLW11dGVkKTtcbiAgICAgIH1cbiAgICAgIC5uZWdhdGl2ZSB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci13YXJuaW5nKTtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgIH1cbiAgICAgIC5jaGsge1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiA0cHg7XG4gICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLXRleHQpO1xuICAgICAgfVxuICAgICAgLmJ0biB7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHRyYW5zcGFyZW50O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgICAgIHBhZGRpbmc6IDZweCAxMnB4O1xuICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjE1cztcbiAgICAgIH1cbiAgICAgIC5idG4tcHJpbWFyeSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHZhcigtLWNvbG9yLXByaW1hcnkpO1xuICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICB9XG4gICAgICAuYnRuLXByaW1hcnk6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjMWQ0ZWQ4OyB9XG4gICAgICAuYnRuLXNlY29uZGFyeSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgICBib3JkZXItY29sb3I6ICNkMWQ1ZGI7XG4gICAgICB9XG4gICAgICAuYnRuLXNlY29uZGFyeTpob3ZlciB7IGJhY2tncm91bmQ6ICNmM2Y0ZjY7IH1cbiAgICAgIC5idG4tZ2hvc3Qge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjZDFkNWRiO1xuICAgICAgICBjb2xvcjogIzZiNzI4MDtcbiAgICAgIH1cbiAgICAgIC5idG4tZ2hvc3Q6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjZjNmNGY2OyB9XG4gICAgICAuYXBwLWZvb3RlciB7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci1tdXRlZCk7XG4gICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBtYXJnaW4tdG9wOiAyMHB4O1xuICAgICAgfVxuICAgICAgLmFwcC1mb290ZXIgY29kZSB7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmM2Y0ZjY7XG4gICAgICAgIHBhZGRpbmc6IDFweCA2cHg7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgIH1cbiAgICAiXSwic291cmNlUm9vdCI6IiJ9 */"]
    });
  }
}

/***/ }),

/***/ 7000:
/*!***************************************!*\
  !*** ./src/app/renovation.service.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RenovationService: () => (/* binding */ RenovationService)
/* harmony export */ });
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! rxjs */ 6196);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common/http */ 6443);



class RenovationService {
  constructor(http) {
    this.http = http;
    this.base = '/api';
  }
  listScenarios() {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.get(`${this.base}/scenarios`));
  }
  getScenario(key) {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.get(`${this.base}/scenarios/${key}`));
  }
  reseed() {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.post(`${this.base}/seed`, {}));
  }
  addStage(scenarioKey, payload) {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.post(`${this.base}/scenarios/${scenarioKey}/stages`, payload));
  }
  updateStage(id, payload) {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.put(`${this.base}/stages/${id}`, payload));
  }
  deleteStage(id) {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.delete(`${this.base}/stages/${id}`));
  }
  addExpense(stageId, payload) {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.post(`${this.base}/stages/${stageId}/expenses`, payload));
  }
  updateExpense(id, payload) {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.put(`${this.base}/expenses/${id}`, payload));
  }
  deleteExpense(id) {
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.firstValueFrom)(this.http.delete(`${this.base}/expenses/${id}`));
  }
  static {
    this.ɵfac = function RenovationService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || RenovationService)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵinject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_2__.HttpClient));
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineInjectable"]({
      token: RenovationService,
      factory: RenovationService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ }),

/***/ 6613:
/*!***************************************!*\
  !*** ./src/app/tape-bar.component.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TapeBarComponent: () => (/* binding */ TapeBarComponent)
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ 316);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 7580);



const _c0 = a0 => ({
  "over-budget": a0
});
const _c1 = (a0, a1) => ({
  "shake-once": a0,
  "over-budget": a1
});
function TapeBarComponent_div_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "div", 7);
  }
}
class TapeBarComponent {
  constructor() {
    this.planned = 0;
    this.actual = 0;
    this.label = '进度';
    this.displayPercent = 0;
    this.isOver = false;
    this.fillGradient = '';
    this.shake = false;
  }
  ngOnInit() {
    this.recalc();
  }
  ngOnChanges(changes) {
    if (changes['planned'] || changes['actual']) {
      this.recalc();
      if (this.isOver) {
        this.shake = false;
        setTimeout(() => this.shake = true, 10);
      }
    }
  }
  recalc() {
    const safePlanned = this.normalize(this.planned);
    const safeActual = this.normalize(this.actual);
    if (safePlanned <= 0) {
      this.displayPercent = 0;
      this.isOver = false;
      return;
    }
    const ratio = safeActual / safePlanned;
    this.displayPercent = Math.min(140, Math.round(ratio * 1000) / 10);
    this.isOver = ratio > 1;
    if (this.isOver) {
      this.fillGradient = 'linear-gradient(90deg, #fca5a5 0%, var(--color-danger) 100%)';
    } else {
      this.fillGradient = 'linear-gradient(90deg, var(--tape-yellow) 0%, #f59e0b 100%)';
    }
  }
  normalize(v) {
    const n = Number(v);
    if (!isFinite(n) || isNaN(n)) return 0;
    return n;
  }
  static {
    this.ɵfac = function TapeBarComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || TapeBarComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: TapeBarComponent,
      selectors: [["app-tape-bar"]],
      inputs: {
        planned: "planned",
        actual: "actual",
        label: "label"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵNgOnChangesFeature"], _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 9,
      vars: 15,
      consts: [[1, "tape-wrap", 3, "title"], [1, "tape-track"], [1, "tape-fill", 3, "ngClass"], ["class", "tape-ticks", 4, "ngIf"], [1, "tape-meta"], [1, "tape-label"], [1, "tape-value", 3, "ngClass"], [1, "tape-ticks"]],
      template: function TapeBarComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0)(1, "div", 1)(2, "div", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](3, TapeBarComponent_div_3_Template, 1, 0, "div", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "div", 4)(5, "span", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "span", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("title", ctx.label);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵstyleProp"]("width", ctx.displayPercent, "%")("background", ctx.fillGradient);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpureFunction1"](10, _c0, ctx.isOver));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.displayPercent > 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx.label);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngClass", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpureFunction2"](12, _c1, ctx.shake, ctx.isOver));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", ctx.displayPercent.toFixed(1), "% ");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_1__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_1__.NgClass, _angular_common__WEBPACK_IMPORTED_MODULE_1__.NgIf],
      styles: [".tape-wrap[_ngcontent-%COMP%] {\n        width: 100%;\n      }\n      .tape-track[_ngcontent-%COMP%] {\n        position: relative;\n        height: 18px;\n        background: repeating-linear-gradient(\n          90deg,\n          #e5e7eb 0px,\n          #e5e7eb 9px,\n          #d1d5db 9px,\n          #d1d5db 10px\n        );\n        border: 1px solid #d1d5db;\n        border-radius: 4px;\n        overflow: hidden;\n      }\n      .tape-fill[_ngcontent-%COMP%] {\n        height: 100%;\n        background: linear-gradient(90deg, var(--tape-yellow) 0%, #f59e0b 100%);\n        transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);\n        animation: tapeSlide 0.9s cubic-bezier(0.16, 1, 0.3, 1);\n        position: relative;\n      }\n      .tape-fill.over-budget[_ngcontent-%COMP%] {\n        background: linear-gradient(90deg, #fca5a5 0%, var(--color-danger) 100%);\n        animation: tapeSlide 0.9s cubic-bezier(0.16, 1, 0.3, 1);\n      }\n      .tape-ticks[_ngcontent-%COMP%] {\n        position: absolute;\n        inset: 0;\n        background-image: repeating-linear-gradient(\n          90deg,\n          rgba(0, 0, 0, 0.25) 0px,\n          rgba(0, 0, 0, 0.25) 1px,\n          transparent 1px,\n          transparent 12px\n        );\n        pointer-events: none;\n      }\n      .tape-meta[_ngcontent-%COMP%] {\n        display: flex;\n        justify-content: space-between;\n        align-items: baseline;\n        margin-top: 4px;\n        font-size: 12px;\n        color: var(--color-muted);\n      }\n      .tape-label[_ngcontent-%COMP%] {\n        font-weight: 500;\n      }\n      .tape-value[_ngcontent-%COMP%] {\n        font-weight: 700;\n        font-variant-numeric: tabular-nums;\n        color: var(--color-text);\n      }\n      .shake-once[_ngcontent-%COMP%] {\n        animation: shake 0.5s ease-in-out;\n      }\n    \n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvdGFwZS1iYXIuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7TUFDTTtRQUNFLFdBQVc7TUFDYjtNQUNBO1FBQ0Usa0JBQWtCO1FBQ2xCLFlBQVk7UUFDWjs7Ozs7O1NBTUM7UUFDRCx5QkFBeUI7UUFDekIsa0JBQWtCO1FBQ2xCLGdCQUFnQjtNQUNsQjtNQUNBO1FBQ0UsWUFBWTtRQUNaLHVFQUF1RTtRQUN2RSxvREFBb0Q7UUFDcEQsdURBQXVEO1FBQ3ZELGtCQUFrQjtNQUNwQjtNQUNBO1FBQ0Usd0VBQXdFO1FBQ3hFLHVEQUF1RDtNQUN6RDtNQUNBO1FBQ0Usa0JBQWtCO1FBQ2xCLFFBQVE7UUFDUjs7Ozs7O1NBTUM7UUFDRCxvQkFBb0I7TUFDdEI7TUFDQTtRQUNFLGFBQWE7UUFDYiw4QkFBOEI7UUFDOUIscUJBQXFCO1FBQ3JCLGVBQWU7UUFDZixlQUFlO1FBQ2YseUJBQXlCO01BQzNCO01BQ0E7UUFDRSxnQkFBZ0I7TUFDbEI7TUFDQTtRQUNFLGdCQUFnQjtRQUNoQixrQ0FBa0M7UUFDbEMsd0JBQXdCO01BQzFCO01BQ0E7UUFDRSxpQ0FBaUM7TUFDbkMiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAgIC50YXBlLXdyYXAge1xuICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgIH1cbiAgICAgIC50YXBlLXRyYWNrIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBoZWlnaHQ6IDE4cHg7XG4gICAgICAgIGJhY2tncm91bmQ6IHJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoXG4gICAgICAgICAgOTBkZWcsXG4gICAgICAgICAgI2U1ZTdlYiAwcHgsXG4gICAgICAgICAgI2U1ZTdlYiA5cHgsXG4gICAgICAgICAgI2QxZDVkYiA5cHgsXG4gICAgICAgICAgI2QxZDVkYiAxMHB4XG4gICAgICAgICk7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkMWQ1ZGI7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgIH1cbiAgICAgIC50YXBlLWZpbGwge1xuICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCg5MGRlZywgdmFyKC0tdGFwZS15ZWxsb3cpIDAlLCAjZjU5ZTBiIDEwMCUpO1xuICAgICAgICB0cmFuc2l0aW9uOiB3aWR0aCAwLjhzIGN1YmljLWJlemllcigwLjE2LCAxLCAwLjMsIDEpO1xuICAgICAgICBhbmltYXRpb246IHRhcGVTbGlkZSAwLjlzIGN1YmljLWJlemllcigwLjE2LCAxLCAwLjMsIDEpO1xuICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICB9XG4gICAgICAudGFwZS1maWxsLm92ZXItYnVkZ2V0IHtcbiAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkwZGVnLCAjZmNhNWE1IDAlLCB2YXIoLS1jb2xvci1kYW5nZXIpIDEwMCUpO1xuICAgICAgICBhbmltYXRpb246IHRhcGVTbGlkZSAwLjlzIGN1YmljLWJlemllcigwLjE2LCAxLCAwLjMsIDEpO1xuICAgICAgfVxuICAgICAgLnRhcGUtdGlja3Mge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIGluc2V0OiAwO1xuICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiByZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KFxuICAgICAgICAgIDkwZGVnLFxuICAgICAgICAgIHJnYmEoMCwgMCwgMCwgMC4yNSkgMHB4LFxuICAgICAgICAgIHJnYmEoMCwgMCwgMCwgMC4yNSkgMXB4LFxuICAgICAgICAgIHRyYW5zcGFyZW50IDFweCxcbiAgICAgICAgICB0cmFuc3BhcmVudCAxMnB4XG4gICAgICAgICk7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgfVxuICAgICAgLnRhcGUtbWV0YSB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGJhc2VsaW5lO1xuICAgICAgICBtYXJnaW4tdG9wOiA0cHg7XG4gICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLW11dGVkKTtcbiAgICAgIH1cbiAgICAgIC50YXBlLWxhYmVsIHtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgIH1cbiAgICAgIC50YXBlLXZhbHVlIHtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgZm9udC12YXJpYW50LW51bWVyaWM6IHRhYnVsYXItbnVtcztcbiAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLXRleHQpO1xuICAgICAgfVxuICAgICAgLnNoYWtlLW9uY2Uge1xuICAgICAgICBhbmltYXRpb246IHNoYWtlIDAuNXMgZWFzZS1pbi1vdXQ7XG4gICAgICB9XG4gICAgIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
}

/***/ }),

/***/ 4429:
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser */ 436);
/* harmony import */ var _app_app_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app/app.component */ 92);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common/http */ 6443);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/platform-browser/animations */ 3835);





(0,_angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__.bootstrapApplication)(_app_app_component__WEBPACK_IMPORTED_MODULE_0__.AppComponent, {
  providers: [(0,_angular_common_http__WEBPACK_IMPORTED_MODULE_2__.provideHttpClient)(), (0,_angular_core__WEBPACK_IMPORTED_MODULE_3__.importProvidersFrom)(_angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_4__.BrowserAnimationsModule)]
}).catch(err => console.error(err));

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["vendor"], () => (__webpack_exec__(4429)));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=main.js.map