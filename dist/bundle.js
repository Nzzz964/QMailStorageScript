!function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);throw(f=new Error("Cannot find module '"+i+"'")).code="MODULE_NOT_FOUND",f}c=n[i]={exports:{}},e[i][0].call(c.exports,function(r){return o(e[i][1][r]||r)},c,c.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}({1:[function(require,module,exports){
// ==UserScript==
// @name         QMailStorageScript
// @namespace    https://github.com/Nzzz964/QMailStorageScript
// @version      0.1
// @description  QMailStorageScript
// @author       Nzzz964
// @match        https://mail.qq.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// ==/UserScript==
!function(){"use strict";const utils={concatenate(...arrays){var size=arrays.reduce((a,b)=>a+b.byteLength,0);const result=new Uint8Array(size);let offset=0;for(const arr of arrays)result.set(arr,offset),offset+=arr.byteLength;return result},downloadAsBlob(data,filename){data=new Blob([data],{type:"octet/stream"});const url=window.URL.createObjectURL(data),a=document.createElement("a");a.style="display: none",a.href=url,a.download=filename,a.setAttribute("initlized","true"),document.body.appendChild(a),a.click(),a.remove(),setTimeout(function(){return window.URL.revokeObjectURL(url)},1e3)},getParams(){const params={},url=location.href,query=url.split("?")[1];if(query){const pairs=query.split("&");pairs.forEach(pair=>{var[pair,value]=pair.split("=");params[pair]=value})}return params}};function getSelectedMails(){return Array.from((document.querySelector("#mainFrameContainer iframe")?.contentDocument??document).querySelectorAll("input[name=mailid]:checked")).map(v=>{const row=v.parentElement.parentElement;return{mid:v.value,title:row.querySelector("u[role=link]").innerText}}).reverse()}function redirect(mid,{onprogress}){return new Promise(resolve=>{const url=new URL("https://mail.qq.com/cgi-bin/download"),xhr=(url.searchParams.set("sid",utils.getParams().sid),url.searchParams.set("mailid",mid),url.searchParams.set("filename","HelloWorld"),new XMLHttpRequest);xhr.open("GET",url),xhr.responseType="arraybuffer",xhr.onprogress=function(ev){ev.lengthComputable&&(ev=ev.loaded/ev.total*100,"function"==typeof onprogress&&onprogress(ev))},xhr.onload=function(ev){resolve(new Uint8Array(this.response))},xhr.send()})}const regexp=new RegExp("^https://mail.qq.com/cgi-bin/frame_html?.*$");if(regexp.test(location.href)){window.QMScript_Mails=window.QMScript_Mails??[],document.querySelector(".topbg")?.insertAdjacentHTML("afterbegin",'<a class="btn_gray" style="position: absolute;top: 39px;right: 385px;" hidefocus="" id="QMScriptAddToList" href="javascript:;">添加到下载</a>'),document.querySelector(".topbg")?.insertAdjacentHTML("afterbegin",'<a class="btn_gray" style="position: absolute;top: 39px;right: 300px;" hidefocus="" id="QMScriptShowPopup" href="javascript:;" initlized="true" md="0">打开列表</a>');document.body.insertAdjacentHTML("beforeend",`
        <div id="QMScript_Popup" style="display:none;">
        <div id="QMScript_Container">
            <p class="header">文件列表</p>
            <ul id="QMscript_MailList">

            </ul>
            <div class="footer">
                <button id="QMscript_Download" type="button">下载</button>
                <button id="QMscript_Clean" type="button">清空</button>
                <button id="QMscript_Close" type="button">关闭</button>
            </div>
        </div>
    </div>
    <style>
        html,
        body {
            margin: 0;
            padding: 0;
        }

        #QMScript_Popup {
            --radius-size: 3px;

            z-index: 999999;

            position: fixed;
            top: 0;
            left: 0;

            box-sizing: border-box;

            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, .3);

            display: flex;
            flex-direction: column;

            overflow: hidden;
        }

        #QMScript_Container {
            margin: auto;
            border-radius: var(--radius-size);
            width: 60%;
            background-color: #fff;

            min-height: 587px;
            max-height: 800px;

            border: 1px solid #e3e6eb;

            display: flex;
            flex-direction: column;
        }

        #QMScript_Container ul {
            list-style: none;
            margin: 0;
            padding: 0;
            height: 100%;
            overflow-y: scroll;
        }

        #QMScript_Container .header {
            position: sticky;
            background-color: #fff;

            top: 0;
            margin: 0;
            padding: 10px;
            font-size: 25px;
            color: #003366;
            text-align: center;
            font-weight: bold;
            border-bottom: 1px solid #e3e6eb;
            border-radius: var(--radius-size) var(--radius-size) 0 0;
            cursor: auto;
        }

        #QMScript_Container .content {
            font-size: 20px;

            background: #fff;
            padding: 12px 10px;
            border-bottom: 1px solid #e3e6eb;

            cursor: move;
            user-select: none;
            transition: background-color linear .2s;

            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: space-between;

            position: relative;
        }

        #QMScript_Container li .delete {
            box-sizing: content-box;
            padding: 0px 5px 0px 5px;
            color: #f20d0d;
            margin: auto 30px auto 30px;
            cursor: pointer;
        }

        #QMScript_Container li:hover {
            background-color: #ececec;
        }

        #QMScript_Container li.over {
            border: 1px dotted black;
            box-shadow: inset 0px 0px 10px 1px #dddddd;
        }

        #QMScript_Container progress {
            position: absolute;
            height: 5px;
            bottom: -3px;
            left: 0;
            width: 100%;
            display: none;
        }

        #QMScript_Container .footer {
            border-top: 1px #e3e6eb solid;
            padding: 15px;
            display: flex;
            gap: 30px;
        }

        #QMScript_Container button {
            height: 50px;
            width: 80px;
            font-size: 20px;
            cursor: pointer;
        }
    </style>
        `);const addToListBtn=document.getElementById("QMScriptAddToList"),popupContainer=document.getElementById("QMScript_Popup"),mailList=document.getElementById("QMscript_MailList"),showPopupBtn=document.getElementById("QMScriptShowPopup"),closePopupBtn=document.getElementById("QMscript_Close"),cleanBtn=document.getElementById("QMscript_Clean"),downloadBtn=document.getElementById("QMscript_Download");function renderMailList(){const mails=window.QMScript_Mails;mailList.innerHTML="";var html=mails.reduce((acc,v)=>acc+`
            <li draggable="true">
                <div class="content" data-mid="${v.mid}">
                ${v.title}
                <span class="delete">X</span>
                <progress value="0" max="100">0%</progress>
                </div>
            </li>
            `,"");mailList.insertAdjacentHTML("beforeend",html);let sourceElem=null;const lis=mailList.querySelectorAll("li");lis.forEach((item,i)=>{item.addEventListener("dragstart",function(ev){this.style.opacity="0.4",sourceElem=this,ev.dataTransfer.effectAllowed="move",ev.dataTransfer.setData("innerHTML",this.innerHTML)}),item.addEventListener("dragend",function(ev){this.style.opacity="1",lis.forEach(item=>item.classList.remove("over"))}),item.addEventListener("dragenter",function(ev){this.classList.add("over")}),item.addEventListener("dragleave",function(ev){this.classList.remove("over")}),item.addEventListener("dragover",function(ev){return ev.preventDefault(),!1}),item.addEventListener("drop",function(ev){return ev.stopPropagation(),sourceElem&&(sourceElem.innerHTML=this.innerHTML),this.innerHTML=ev.dataTransfer.getData("innerHTML"),addDeleteEvent(),!1})}),addDeleteEvent()}function addDeleteEvent(){const deletes=mailList.querySelectorAll(".delete");deletes.forEach((item,i)=>{item.onclick=function(ev){this.parentElement.parentElement.remove()}})}addToListBtn.addEventListener("click",function(ev){window.QMScript_Mails.push(...getSelectedMails());const memory=new Map;window.QMScript_Mails=window.QMScript_Mails.filter(v=>{v=v.mid;return!memory.has(v)&&(memory.set(v,!0),!0)})}),showPopupBtn.addEventListener("click",function(ev){popupContainer.style.display="flex",renderMailList()}),cleanBtn.addEventListener("click",function(ev){window.QMScript_Mails=[],renderMailList()}),closePopupBtn.addEventListener("click",function(ev){var contents;popupContainer.style.display="none",window.QMScript_Mails=(contents=mailList.querySelectorAll(".content"),Array.from(contents).map(v=>{return{mid:v.dataset.mid,title:v.childNodes[0].data.trim()}}))}),downloadBtn.addEventListener("click",async function(ev){ev.preventDefault();const contents=mailList.querySelectorAll(".content");ev=contents[0].childNodes[0].data.trim();const uint8=[];for(const content of contents){const progress=content.querySelector("progress");progress.style.display="block";var data=await redirect(content.dataset.mid,{onprogress:percent=>{progress.value=percent}});uint8.push(data)}return closePopupBtn.setAttribute("disabled",""),this.setAttribute("disabled",""),utils.downloadAsBlob(utils.concatenate(...uint8),ev),window.QMScript_Mails=[],renderMailList(),this.removeAttribute("disabled"),closePopupBtn.removeAttribute("disabled"),!1})}}()},{}]},{},[1]);