$(function () {
    sessionStorage.user = "admin";
    sessionStorage.dpCount = 0;
    var options = {
        elme: "#draw-price",
        btn: "img/draw-btn.png",
        bg: "img/zhuzi.png"
    }
    var dPrice = null;
    $.ajax({
        url: "http://data.speiyouzx.com/public/index.php?service=App.Activity_OnOff.GetPrices",
        data: "admin",
        dataType: "json",
        type: "POST",
        success: function (d) {
            var data = d.data.order;
            options.data = getOrder(data);
            dPrice = new drawPrice(options).init();
        },
        error: function (d) {
            msg("加载失败");
        }
    })

    $(".run").on("click", function () {
        var elm = $(this);
        if (!dPrice || elm.is(".active")) return false;
        if (sessionStorage.dpCount >= 3) {
            $(".alert").remove();
            msg("您的抽奖次数已用完！");

            return false;
        }

        dPrice.run();
        elm.addClass("active");
        /* //前台计算概率
        dPrice.pause(2, function (r) {
            var text = r.name == "未中奖" ? "很遗憾你没有中奖。" : "恭喜您中了" + r.name + "!";
            msg(text);
            ;
            setTimeout(function () {
                // dPrice.init(getOrder(d.orderes));
                elm.removeClass("active");
            }, 2600);

            sessionStorage.dpCount++;
        }, true);
        return false; */
        //后台获取
        dPrice.pause(1.2, {
            url: "http://data.speiyouzx.com/public/index.php?service=App.Activity_OnOff.GetPrices",
            success: function (d) {
                console.log(d);
                var text = d.name == "未中奖" ? "很遗憾你没有中奖。" : "恭喜您中了" + d.name + "!";
                msg(text);;
                setTimeout(function () {
                    dPrice.init(getOrder(d.orderes));
                    elm.removeClass("active");
                }, 2600);

                sessionStorage.dpCount++;
            }
        });
    })


    //抽奖对象
    function drawPrice(options) {
        var orderes = options.data ? options.data : null;
        var elm = $(options.elme);
        var vas = elm.find(".vas")[0];
        var lock = false;
        var W = elm.width();
        var H = elm.height();
        var times = 0;
        $(vas).attr("width", W);
        $(vas).attr("height", H);
        var R = Math.min(W / 2, H / 2);
        var nowPst = 0;
        var tastT = 0;
        var nowT = -1;
        var pauseCb = null;
        //初始化盘
        this.init = function (data) {
            tastT = 0;
            lock = false;
            nowT = -1;
            pauseCb = null;
            var data = data ? data : orderes;
            if (!data) return false;
            orderes = data;
            preload(["img/zhuzi.png", "img/draw-btn.png"], function () {
                draw(data, 1);
            })

            return this;
        }
        //run
        this.run = function () {
            tastT = 0;
            lock = false;
            pauseCb = null;
            run();
        }
        //pause
        this.pause = function (d, cb, f) {

            if (!f) {
                $.ajax({
                    url: cb.url,
                    data: cb.data,
                    success: function (data) {
                        var data = data.data;
                        var rag = 0;
                        var name;
                        var ord = data.order;
                        var result = 0;
                        for (var i = 0; i < orderes.length; i++) {
                            var max = rag + orderes[i].rang;
                            if (orderes[i].name == data.price) {
                                result = Math.random() * (max - rag) + rag;
                                name = orderes[i].name;

                                break;
                            }
                            rag += orderes[i].rang;
                        }
                        tastT = d * 1000;
                        nowT = 0;
                        pauseCb = function (d) {


                            tastT = 0;
                            lock = true;
                            nowT = -1;
                            pauseCb = null;
                            jiansu(result, function (np) {
                                nowPst = result;
                                var st = new Date().getTime(),
                                    ood = 0;
                                var i = setInterval(function () {

                                    if (new Date().getTime() - st >= 1000) {
                                        clearInterval(i);
                                        draw(orderes, nowPst);
                                        cb.success && cb.success({
                                            orderes: ord,
                                            name: name
                                        });
                                        return false;
                                    }
                                    ood = ood ? 0 : 1;
                                    draw(orderes, nowPst, ood);
                                }, 80)
                            })


                            // orderes = ord;


                        }

                    },
                    error: function (e) {
                        cb.error && cb.error(d);
                    }
                })
                return false;
            }

            tastT = d * 1000;
            nowT = 0;
            console.log(tastT, nowT);
            pauseCb = function (d) {
                drawResult(function (data) {

                    tastT = 0;
                    lock = true;
                    pauseCb = null;
                    nowT = -1;
                    jiansu(data.rdm, function (np) {
                        nowPst = data.rdm;
                        var st = new Date().getTime(),
                            ood = 0;
                        var i = setInterval(function () {

                            if (new Date().getTime() - st >= 1000) {
                                clearInterval(i);
                                draw(orderes, nowPst);
                                cb(data);
                                return false;
                            }
                            ood = ood ? 0 : 1;
                            draw(orderes, nowPst, ood);
                        }, 80)
                    })



                })
            }
            // lock = true;
            // run(d)
        }

        function jiansu(ol, cb) {
            var sl = 10;
            t = setInterval(function () {
                // var abs = Math.abs(nowPst - ol);
                var abs = ol - nowPst;
                if (abs >= 0 && abs <= 0.005) {
                    clearInterval(t);
                    nowPst = ol;
                    cb && cb(ol);
                    return false;
                }
                nowPst = nowPst > 1 ? 0 : nowPst;
                draw(orderes, nowPst);
                sl += 30;
                nowPst += 20 / (350 + sl);
            }, 20)

        }

        function run() {


            var onece = function () {
                if (lock) return false;
                requestAnimationFrame(function (d) {
                    times = d;
                    (nowT == 0) && (nowT = times);
                    if (tastT !== 0 && d - nowT >= tastT) {
                        pauseCb && pauseCb(nowPst);
                        return false;
                    }
                    if (lock) return false;
                    if (nowPst > 1) nowPst = 0;
                    nowPst += 20 / 350;
                    draw(orderes, nowPst);
                    onece();
                })
            }
            onece();
        }
        //抽奖结果
        function drawResult(data) {
            if (!data) return false;
            //前端概率计算结果
            if (typeof data == "function") {
                var rdm = Math.random(),
                    cunt = 0;
                for (var i = 0; i < orderes.length; i++) {
                    if (cunt < rdm && rdm <= cunt + orderes[i].rang) {
                        var r = {
                            min: cunt,
                            max: cunt + orderes[i].rang,
                            rdm: rdm,
                            name: orderes[i].name
                        }
                        data(r);
                        return true;
                    }
                    cunt += orderes[i].rang;
                }
                return false;
            }
            //后台决定结果

        }
        //画扇形
        function draw(data, _a, o) {
            var hb = vas.getContext("2d");

            hb.clearRect(0, 0, W, H);
            var colors = ["red", "cyan", "yellow"];
            var startReg = -Math.PI / 2;
            hb.beginPath();
            hb.arc(W / 2, H / 2, R, 0, Math.PI * 2);
            hb.arc(W / 2, H / 2, R, 0, Math.PI * 2);
            hb.fillStyle = "#05b1ea";
            hb.fill();
            hb.closePath();
            hb.beginPath();
            hb.save();
            hb.arc(W / 2, H / 2, R - 5, 0, Math.PI * 2);
            hb.strokeStyle = "#5b5d5e";
            hb.shadowOffsetX = 0;
            hb.shadowOffsetY = 0;
            hb.shadowBlur = 6;
            hb.shadowColor = 'rgba(0, 0, 0, 0.8)';
            hb.stroke();
            hb.closePath();
            hb.restore();
            for (var i = 0; i < data.length; i++) {
                var _reg = 2 * Math.PI * data[i].rang;
                var regCount = startReg;
                for (var j = 0; j < i; j++) {
                    regCount += 2 * Math.PI * data[j].rang

                }
                hb.fillStyle = randomColor(i);
                hb.beginPath();
                hb.arc(W / 2, H / 2, R - 24, regCount, regCount + _reg, false);
                hb.arc(W / 2, H / 2, 60, regCount + _reg, regCount, true);
                hb.fill();
                hb.save();
            }
            for (var i = 0; i < data.length; i++) {
                var _reg = 2 * Math.PI * data[i].rang;
                var regCount = startReg;
                for (var j = 0; j < i; j++) {
                    regCount += 2 * Math.PI * data[j].rang

                }
                hb.fillStyle = "#fff";
                var text = data[i].name;
                hb.translate(R + Math.cos(regCount + _reg / 2) * R * .8, R + Math.sin(regCount +
                        _reg / 2) *
                    R * .8);
                hb.shadowOffsetX = 0;
                hb.shadowOffsetY = 0;
                hb.shadowBlur = 2;
                hb.shadowColor = 'rgba(0, 0, 0, 0.8)';
                hb.rotate(regCount + _reg / 2 + Math.PI / 2);
                hb.font = 'bold 12px Microsoft YaHei';
                hb.fillText(text, -hb.measureText(text).width / 2, 20);

                hb.restore();
                hb.save();
            }
            var img1 = new Image();
            $(img1).width(100);
            $(img1).height(156);
            var img2 = new Image();
            $(img2).width(2 * R - 40);
            $(img2).height(2 * R - 40);
            var x0 = R - 110;
            var y0 = H / 2 - 110;
            var a = Math.PI * 2 * _a;
            var imgLoad = 0;
            img1.onload = function () {
                imgLoad++;
                imgLoad == 2 && loadRender();
            }
            img2.onload = function () {
                imgLoad++;
                imgLoad == 2 && loadRender();
            }

            img2.src = options.bg;
            img1.src = options.btn;
            loadRender();

            function loadRender() {
                if (!o) {
                    hb.drawImage(img2, 10, 10, 2 * R - 20, 2 * R - 20);
                }
                hb.save();

                hb.translate(W / 2, H / 2);
                hb.rotate(a);
                /*  var x = x0 * Math.cos(a) - (y0 - 1) * Math.sin(a);
                 var y = 1 + x0 * Math.sin(a) + (y0 - 1) * Math.cos(a); */
                hb.drawImage(img1, -50, -106, 100, 156);
                hb.closePath()
                hb.restore();
                hb.save();
            }
        }
        //随机颜色
        function randomColor(i) {
            var colors = ["#f1dd02", "#20a716", "#abf102", "#a76a16", "#1652a7", "#02dbf1"];

            return i == colors.length - 1 ? colors[1] : colors[i % colors.length];
        }
        //加载器
        function preload(images, complete) {
            var total = new Array();
            for (var i = 0; i < images.length; i++) {
                var _img = new Image();
                _img.onload = function () {
                    total.push(this);
                    total.length === images.length && complete && complete();
                };
                _img.onerror = function () {
                    total.push(this);
                    total.length === images.length && complete && complete();
                };
                _img.src = images[i];
            };
        }
    }

    function getOrder(data) {
        var r = [];
        for (var i = 0; i < data.length; i++) {
            for (var j in data[i]) {
                r.push({
                    rang: j / 100,
                    name: data[i][j]
                })
            }

        }
        return r;
    }

    function msg(d) {
        if (d == -1) {

            setTimeout(function () {
                $(".alert").removeClass("in");
                setTimeout(function () {
                    $(".alert").remove();
                    $(".alert-layer").remove();
                }, 600);

            }, 2000);
            return false;
        }
        var h = [
            "<div class='alert-layer'></div>",
            "<div class='alert'>",
            d,
            "</div>"
        ].join("");
        var e = $(h);
        $("body").append(e);
        setTimeout(function () {
            $(".alert").addClass("in");
        }, 0);
        setTimeout(function () {
            msg(-1)
        }, 0);
    }
})