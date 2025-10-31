import{h as p}from"./app-Cz-XC9l4.js";var d={exports:{}},m={};/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var W;function D(){if(W)return m;W=1;var f=p();function E(r,u){return r===u&&(r!==0||1/r===1/u)||r!==r&&u!==u}var V=typeof Object.is=="function"?Object.is:E,j=f.useSyncExternalStore,w=f.useRef,z=f.useEffect,M=f.useMemo,_=f.useDebugValue;return m.useSyncExternalStoreWithSelector=function(r,u,v,s,n){var t=w(null);if(t.current===null){var o={hasValue:!1,value:null};t.current=o}else o=t.current;t=M(function(){function S(e){if(!R){if(R=!0,c=e,e=s(e),n!==void 0&&o.hasValue){var i=o.value;if(n(i,e))return l=i}return l=e}if(i=l,V(c,e))return i;var h=s(e);return n!==void 0&&n(i,h)?(c=e,i):(c=e,l=h)}var R=!1,c,l,b=v===void 0?null:v;return[function(){return S(u())},b===null?void 0:function(){return S(b())}]},[u,v,s,n]);var a=j(r,t[0],t[1]);return z(function(){o.hasValue=!0,o.value=a},[a]),_(a),a},m}var y;function O(){return y||(y=1,d.exports=D()),d.exports}var q=O();export{q as w};
