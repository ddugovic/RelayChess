import stockfishWorker from './lib/stockfishWorker.js';
import Chess from './lib/chess.js';
import { Chessground } from 'chessground';

// I really don't know why this is even here or necessary...
// window.requestAnimFrame = (function(){
//     return  window.requestAnimationFrame   ||
//         window.webkitRequestAnimationFrame ||
//         window.mozRequestAnimationFrame    ||
//         window.oRequestAnimationFrame      ||
//         window.msRequestAnimationFrame     ||
//         function(/* function */ callback, /* DOMElement */ element){
//             window.setTimeout(callback, 1000 / 60);
//         };
// });

angular
    .module("relayApp")
    .controller("playAIController", function ($rootScope, $scope, $http, $window, $route, $routeParams,
                                              $location, $localStorage, ModalService, relayAudio) {
        relayAudio.ensureLobbyIsNotPlaying();

        var level = $routeParams.level;
        var playOrientation = $routeParams.orientation=="w"?"white":"black";

        var fen = undefined;

        var chess = new Chess(fen);

        var stockfish = stockfishWorker({
            minDepth: 10,
            variant: "relay"
        }, "stockfishRelay");

        var board = angular.element("#relayAIBoard")[0];
        var ground = Chessground(board,
                                 {
                                     orientation: playOrientation,
                                     turnColor: chessToColor(chess),
                                     viewOnly: false,
                                     animation: {
                                         duration: 250
                                     },
                                     movable: {
                                         free: false,
                                         color: playOrientation,
                                         dests: chessToDests(chess),
                                         events: {
                                             after: onMove
                                         }
                                     },
                                     premovable: {
                                         relay: true
                                     },
                                     drawable: {
                                         enabled: true
                                     },
                                     selectable: {
                                         enabled: false
                                     }
                                 });

        //UI bindings
        $scope.backToLobby = function(){
            $location.path("lobby");
        };

        function playSound(move){
            //sounds
            if(move.flags.indexOf("c") != -1 || move.flags.indexOf("e") != -1)
            {
                //capture
                relayAudio.playSound("capture");
            }
            else if(move.flags.indexOf("k") != -1 || move.flags.indexOf("q") != -1)
            {
                //castle
                relayAudio.playSound("castle");
            }
            else
            {
                //move
                relayAudio.playSound("move");
            }

            if (chess.in_check())
            {
                //check
                relayAudio.playSound("check");
            }
        }

        function onAIMove(uci){
            console.log("AI -> move");

            var res = /([a-h1-8]{2})([a-h1-8]{2})([qrbn]{1})?/g.exec(uci.eval.best);

            var from = res[1];
            var to = res[2];
            var promotion = res[3]?res[3]:null;

            var move = {
                from:from,
                to:to,
                promotion:promotion
            };

            move = chess.move(move);

            if(!move){
                console.log("Illegal move! " + uci.eval.best);
            }

            //our turn -> movable pieces
            ground.set({
                fen: chess.fen(),
                lastMove: [move.from, move.to],
                turnColor: chessToColor(chess),
                movable: {
                    color: chessToColor(chess),
                    dests: chessToDests(chess)
                },
                check: false
            });

            if(chess.in_check())
            {
                ground.set({check: chessToColor(chess)});
            }

            //play premove if set
            ground.playPremove();

            playSound(move);
        }

        function SearchAIMove()
        {
            //search next AI move (web worker?)
            console.log("search AI move");

            stockfish.start({
                initialFen: chess.fen(),
                moves: chess.history(),
                ply: (chess.turn()=="w")?0:1,
                maxDepth: 21,
                emit: function(res) {
                    stockfish.stop();

                    onAIMove(res);
                }
            });
        }

        //promotion ui
        var pendingPromotion = null;

        $(".promoteQueen").click(function(){
            onPromotionFinalize("q");
        });

        $(".promoteRook").click(function(){
            onPromotionFinalize("r");
        });

        $(".promoteBishop").click(function(){
            onPromotionFinalize("b");
        });

        $(".promoteKnight").click(function(){
            onPromotionFinalize("n");
        });

        function onPromotion(orig, dest)
        {
            pendingPromotion = {orig: orig, dest: dest};

            $(".promotePanel").css("visibility", "visible");
        }

        function onPromotionFinalize(promote)
        {
            if(pendingPromotion == null)
            {
                return;
            }

            $(".promotePanel").css("visibility", "hidden");

            var move = chess.move({from: pendingPromotion.orig, to: pendingPromotion.dest, promotion: promote});

            ground.set({
                fen: chess.fen(),
                turnColor: chessToColor(chess),
                check: false
            });

            if(chess.in_check())
            {
                ground.set({check: chessToColor(chess)});
            }

            SearchAIMove();

            pendingPromotion = null;
        }

        function onMove(orig, dest) {
            console.log(orig + " " + dest);

            //handle promotion
            var piece = chess.get(orig);

            var rank = chess.rank(orig);
            if(piece.type == "p" &&
               ((chess.turn() == "w" && rank == 1) ||
                (chess.turn() == "b" && rank == 6)))
            {
                onPromotion(orig, dest);

                return false;
            }

            var move = chess.move({from: orig, to: dest});

            ground.set({
                fen: chess.fen(),
                turnColor: chessToColor(chess),
                check: false
            });

            if(chess.in_check())
            {
                ground.set({check: chessToColor(chess)});
            }

            playSound(move);

            SearchAIMove();
        };

        function chessToDests(chess) {
            var dests = {};
            chess.SQUARES.forEach(function(s) {
                var ms = chess.moves({square: s, verbose: true});
                if (ms.length) dests[s] = ms.map(function(m) { return m.to; });
            });
            return dests;
        }

        function chessToColor(chess) {
            return (chess.turn() == "w") ? "white" : "black";
        }
    });
