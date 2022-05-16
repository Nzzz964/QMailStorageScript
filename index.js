// ==UserScript==
// @name         QMailStorageScript
// @namespace    https://github.com/Nzzz964/QMailStorageScript
// @version      0.1
// @description  QMailStorageScript
// @author       Nzzz964
// @match        https://mail.qq.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// ==/UserScript==

(function () {
    'use strict';
    const utils = {
        concatenate(...arrays) {
            const size = arrays.reduce((a, b) => a + b.byteLength, 0)
            const result = new Uint8Array(size)
            let offset = 0
            for (const arr of arrays) {
                result.set(arr, offset)
                offset += arr.byteLength
            }
            return result
        },
        downloadAsBlob(data, filename) {
            let blob = new Blob([data], {
                type: "octet/stream",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style = "display: none";

            a.href = url;
            a.download = filename;
            a.setAttribute('initlized', 'true');
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () {
                return window.URL.revokeObjectURL(url);
            }, 1000);
        },
        getParams() {
            const params = {};
            const url = location.href;
            const query = url.split('?')[1];
            if (query) {
                const pairs = query.split('&');
                pairs.forEach(pair => {
                    const [key, value] = pair.split('=');
                    params[key] = value;

                });
            }
            return params;
        }
    }

    function frame() {
        return document.querySelector('#mainFrameContainer iframe')?.contentDocument ?? document;
    }

    function getSid() {
        return utils.getParams().sid;
    }

    function getSelectedMails() {
        return Array.from(frame().querySelectorAll(`input[name=mailid]:checked`)).map(v => {
            const row = v.parentElement.parentElement;
            const mid = v.value;
            const title = row.querySelector('u[role=link]').innerText;
            return { mid, title };
        }).reverse();
    }

    function redirect(mid, { onprogress }) {
        return new Promise(resolve => {
            const url = new URL('https://mail.qq.com/cgi-bin/download');
            url.searchParams.set('sid', getSid());
            url.searchParams.set('mailid', mid);
            url.searchParams.set('filename', "HelloWorld");

            const xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = "arraybuffer";
            xhr.onprogress = function (ev) {
                if (ev.lengthComputable) {
                    const percent = (ev.loaded / ev.total) * 100;
                    if (typeof onprogress === "function") {
                        onprogress(percent);
                    }
                }
            }
            xhr.onload = function (ev) {
                resolve(new Uint8Array(this.response));
            }
            xhr.send();
        });
    }

    const regexp = new RegExp('^https:\/\/mail.qq.com\/cgi-bin\/frame_html?.*$');

    if (regexp.test(location.href)) {
        window.QMScript_Mails = window.QMScript_Mails ?? [];

        document.querySelector('.topbg')
            ?.insertAdjacentHTML('afterbegin', `<a class="btn_gray" style="position: absolute;top: 39px;right: 385px;" hidefocus="" id="QMScriptAddToList" href="javascript:;">添加到下载</a>`);
        document.querySelector('.topbg')
            ?.insertAdjacentHTML('afterbegin', `<a class="btn_gray" style="position: absolute;top: 39px;right: 300px;" hidefocus="" id="QMScriptShowPopup" href="javascript:;" initlized="true" md="0">打开列表</a>`);

        const popup =
            '<div id="QMScript_Popup" style="display:none;">' +
            '<div id="QMScript_Container">' +
            '<p class="header">文件列表</p>' +
            '<ul id="QMscript_MailList">' +
            '</ul>' +
            '<div class="footer">' +
            '<button id="QMscript_Download" type="button">下载</button>' +
            '<button id="QMscript_Clean" type="button">清空</button>' +
            '<button id="QMscript_Close" type="button">关闭</button>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<style>' +
            'html,body {margin: 0; padding: 0; }' +
            '#QMScript_Popup {--radius-size: 3px; z-index: 999999; position: fixed; top: 0; left: 0; box-sizing: border-box; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, .3); display: flex; flex-direction: column; overflow: hidden; }' +
            '#QMScript_Container {margin: auto; border-radius: var(--radius-size); width: 60%; background-color: #fff; min-height: 587px; max-height: 800px; border: 1px solid #e3e6eb; display: flex; flex-direction: column; }' +
            '#QMScript_Container ul {list-style: none; margin: 0; padding: 0; height: 100%; overflow-y: scroll; }' +
            '#QMScript_Container .header {position: sticky; background-color: #fff; top: 0; margin: 0; padding: 10px; font-size: 25px; color: #003366; text-align: center; font-weight: bold; border-bottom: 1px solid #e3e6eb; border-radius: var(--radius-size) var(--radius-size) 0 0; cursor: auto; }' +
            '#QMScript_Container .content {font-size: 20px; background: #fff; padding: 12px 10px; border-bottom: 1px solid #e3e6eb; cursor: move; user-select: none; transition: background-color linear .2s; display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; position: relative; }' +
            '#QMScript_Container li .delete {box-sizing: content-box; padding: 0px 5px 0px 5px; color: #f20d0d; margin: auto 30px auto 30px; cursor: pointer; }' +
            '#QMScript_Container li:hover {background-color: #ececec; }' +
            '#QMScript_Container li.over {border: 1px dotted black; box-shadow: inset 0px 0px 10px 1px #dddddd; }' +
            '#QMScript_Container progress {position: absolute; height: 5px; bottom: -3px; left: 0; width: 100%; display: none; }' +
            '#QMScript_Container .footer {border-top: 1px #e3e6eb solid; padding: 15px; display: flex; gap: 30px; }' +
            '#QMScript_Container button {height: 50px; width: 80px; font-size: 20px; cursor: pointer;}' +
            '</style>';

        document.body.insertAdjacentHTML('beforeend', popup);

        const addToListBtn = document.getElementById('QMScriptAddToList');
        const popupContainer = document.getElementById('QMScript_Popup');
        const mailList = document.getElementById('QMscript_MailList');
        const showPopupBtn = document.getElementById('QMScriptShowPopup');
        const closePopupBtn = document.getElementById('QMscript_Close');
        const cleanBtn = document.getElementById('QMscript_Clean');
        const downloadBtn = document.getElementById('QMscript_Download');

        addToListBtn.addEventListener('click', function (ev) {
            window.QMScript_Mails.push(...getSelectedMails());

            const memory = new Map();
            window.QMScript_Mails = window.QMScript_Mails.filter(v => {
                const mid = v.mid;

                if (memory.has(mid)) {
                    return false;
                }

                memory.set(mid, true);
                return true;
            });
        });
        showPopupBtn.addEventListener('click', function (ev) {
            popupContainer.style.display = 'flex';
            renderMailList();
        });
        cleanBtn.addEventListener('click', function (ev) {
            window.QMScript_Mails = [];
            renderMailList();
        });
        closePopupBtn.addEventListener('click', function (ev) {
            popupContainer.style.display = 'none';
            window.QMScript_Mails = serialize();
        });
        downloadBtn.addEventListener('click', async function (ev) {
            ev.preventDefault();
            closePopupBtn.setAttribute('disabled', '');
            cleanBtn.setAttribute('disabled', '');
            this.setAttribute('disabled', '');

            const contents = mailList.querySelectorAll('.content');
            do {
                if (contents.length === 0) break;
                const filename = contents[0].childNodes[0].data.trim();
                const uint8 = [];
                for (const content of contents) {
                    const progress = content.querySelector('progress');
                    progress.style.display = 'block';
                    const mid = content.dataset.mid;
                    const data = await redirect(mid, {
                        onprogress: (percent) => {
                            progress.value = percent;
                        }
                    });
                    uint8.push(data);
                }
                utils.downloadAsBlob(utils.concatenate(...uint8), filename);
                window.QMScript_Mails = [];
                renderMailList();
            } while (false);

            this.removeAttribute('disabled');
            cleanBtn.removeAttribute('disabled');
            closePopupBtn.removeAttribute('disabled');
            return false;
        });


        function renderMailList() {
            const mails = window.QMScript_Mails;
            mailList.innerHTML = '';

            const html = mails.reduce((acc, v) => {
                return acc +
                    `<li draggable="true">` +
                    `<div class="content" data-mid="${v.mid}">` +
                    `${v.title}` +
                    `<span class="delete">X</span>` +
                    `<progress value="0" max="100">0%</progress>` +
                    `</div>` +
                    `</li>`;
            }, '');

            mailList.insertAdjacentHTML('beforeend', html);

            let sourceElem = null;
            const lis = mailList.querySelectorAll('li');
            lis.forEach((item, i) => {
                item.addEventListener('dragstart', function (ev) {
                    this.style.opacity = '0.4';
                    sourceElem = this;
                    ev.dataTransfer.effectAllowed = 'move';
                    ev.dataTransfer.setData('innerHTML', this.innerHTML);
                });

                item.addEventListener('dragend', function (ev) {
                    this.style.opacity = '1';
                    lis.forEach((item) => item.classList.remove('over'));
                });

                item.addEventListener('dragenter', function (ev) {
                    this.classList.add('over');
                });

                item.addEventListener('dragleave', function (ev) {
                    this.classList.remove('over');
                });

                item.addEventListener('dragover', function (ev) {
                    ev.preventDefault();
                    return false;
                });

                item.addEventListener('drop', function (ev) {
                    ev.stopPropagation();
                    if (sourceElem) sourceElem.innerHTML = this.innerHTML;
                    this.innerHTML = ev.dataTransfer.getData('innerHTML');

                    addDeleteEvent();
                    return false;
                });

            });

            addDeleteEvent();
        }

        function addDeleteEvent() {
            const deletes = mailList.querySelectorAll('.delete');
            deletes.forEach((item, i) => {
                item.onclick = function (ev) {
                    this.parentElement.parentElement.remove();
                };
            });
        }

        function serialize() {
            const contents = mailList.querySelectorAll('.content');
            return Array.from(contents).map(v => {
                const mid = v.dataset.mid;
                const title = v.childNodes[0].data.trim();
                return { mid, title };
            });
        }
    }
})();