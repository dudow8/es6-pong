"use strict" ;

/*********************************
    DEFAULT BASE CLASSES
*********************************/
class Util {
    static getRandInteger( min, max ) {
        return Math.floor( Math.random() * ( max - min + 1 ) ) + min ;
    }
    static getElementHTML( selector ) {
        let element = document.querySelector( selector ) ;

        if( element )
            return element.innerHTML ;
        else
            return "" ;
    }
    static setElementHTML( selector, HTML ) {
        let elements = document.querySelectorAll( selector ) ;

        for( let element of elements ) {
            element.innerHTML = HTML ;
        }
    }
    static setElementStyle( selector, style ) {
        let elements = document.querySelectorAll( selector ) ;
        for( let element of elements ) {
            for( let attr in style ) {
                element.style[attr] = style[attr] ;
            }
        }
    }
    static setElementClick( selector, callback ) {
        let elements = document.querySelectorAll( selector ) ;

        for( let element of elements ) {
            element.onclick = ( event ) => {
                callback( this, event ) ;
            } ;
        }
    }
}

/*
 *  Generic Supper class for building a game.
 *  With this class is possible to add and render game objects,
 *  controll if the game is stopped, started, paused, and
 *  run all observers and handlers during the main Loop Execution
 */
class Game {
    constructor( _canvas, _width, _heigth, _fps = 60 ) {
        this._canvas = _canvas ;
        this._width = _width ;
        this._heigth = _heigth ;
        this._fps = _fps ;
        this._objects = [] ;
        this._observers = [] ;
        this._paused = true ; // The game needs to start paused for menu display reasons
        
        this.gameInteraction = () => {
            if( ! this._paused ) {
                this._context.clearRect( 0, 0, this._canvas.width, this._canvas.height ) ;

                for( let observer of this._observers ) {
                    observer() ;
                }
                for( let object of this._objects ) {
                    this._context.beginPath() ;
                    object.update() ;
                }
            }
        } ;

        let context = _canvas.getContext( '2d' ) ;

        _canvas.width = _width ;
        _canvas.height = _heigth ;

        if( context ) this._context = context ;
    }

    isPaused() {
        return this._paused ;
    }

    pause() {
        if( ! this._paused )
            this._paused = true ;
    }

    resume() {
        if ( this._paused ) this._paused = false ;
    }

    getContext() {
        return this._context ;
    }

    addObject( ...objects ) {
        for( let object of objects ) {
            object.setContext( this._context ) ;
            this._objects.push( object ) ;
        }
    }

    addObserver( observer ) {
        this._observers.push( observer ) ;
    }

    start() {
        this.gameLoop() ;
    }

    stop() {
        if( this._gameLoopInterval )
            clearInterval( this._gameLoopInterval ) ;

        this._gameLoopInterval = 0 ;
    }

    gameLoop() {
        this._gameLoopInterval = setInterval( this.gameInteraction, 1000 / this._fps ) ;
    }
}

/*
 *  Sigleton to observe colliders and notify game objects a handler
 */
class Collider {
    constructor() {
        this._observers = [] ;
        this.observer = () => {
            for( let objectA of this._observers ) {
                let collisionList = [] ;
                
                for( let objectB of this._observers ) {
                    if( objectB != objectA && this.isCollided( objectA, objectB ) ) {
                        collisionList.push( objectB ) ;
                    }
                }

                if( collisionList.length )
                    objectA.collision( collisionList ) ;
            }
        } ;
    }

    static getInstance() {
        if( this._instance == null ) {
            this._instance = new Collider() ;
        }

        return this._instance ;
    }

    watch( ...objects ) {
        for( let object of objects ) {
            this._observers.push( object ) ;
        }
    }

    isCollided( a, b ) {
        let hit_x = false ;
        let hit_y = false ;

        if( a.style.x <= b.style.x ) {
            if ( ( a.style.x + a.style.width ) >= b.style.x )
                hit_x = true ;
        }
        else {
            if( ( b.style.x + b.style.width ) >= a.style.x )
                hit_x = true ;
        }

        if( a.style.y <= b.style.y ) {
            if( ( a.style.y + a.style.height ) >= b.style.y )
                hit_y = true ;
        }
        else {
            if( ( b.style.y + b.style.height ) >= a.style.y )
                hit_y = true ;
        }

        if( hit_x && hit_y )
            return true ;

        return false ;
    }
}

/*
 *  Generic Supper class for building and rendering a single game object. 
 */
class GameObject {
    constructor() {
        this._updateHandler = [] ;
        this._colliderHandler = [] ;
        this.style = { x: 0, y: 0, width: 0, height: 0 } ;
    }

    setContext( context ) {
        this._context = context ;
    }

    build() { } ;

    update() {
        for( let handler of this._updateHandler ) {
            handler() ;
        }

        this.build() ;
    }

    collision( components ) {
        for( let handler of this._colliderHandler ) {
            handler( components ) ;
        }
    }

    addUpdateHanlder( handler ) {
        this._updateHandler.push( handler ) ;
    }

    addCollisionHanlder( handler ) {
        this._colliderHandler.push( handler ) ;
    }

    applyStyle() {
        let context = this._context ;

        if( this.style.fill ) {
            context.fillStyle = this.style.fill.color ;
            context.fill() ;
        }

        if( this.style.stroke ) {
            context.strokeStyle = this.style.stroke.color ;
            context.stroke() ;
        }
    }
}




/*********************************
    GAME OBJECT CLASSES
*********************************/
class PlayerBar extends GameObject {
    constructor( id ) {
        super() ;

        this.direction = "down" ;
        this.speed = 3 ;
        this.id = id ;
        this.style.width = 10 ;
        this.style.height = 100 ;
        this.style.fill = { color: "#FFFFFF" } ;
    }

    build() {
        let context = this._context ;
        context.rect( this.style.x, this.style.y, this.style.width, this.style.height ) ;
        this.applyStyle() ;
    }
}

class PlayerBall extends GameObject {
    constructor( id ) {
        super() ;

        this.speed = { x: 5, y: 5 } ;

        this.autoUpdateDirection = () => {
            switch( this.direction ) {
                case "up-left":
                    this.style.y -= this.speed.y ;
                    this.style.x -= this.speed.x ;
                break;

                case "up-right":
                    this.style.y -= this.speed.y ;
                    this.style.x += this.speed.x ;
                break;

                case "down-left":
                    this.style.y += this.speed.y ;
                    this.style.x -= this.speed.x ;
                break ;

                case "down-right":
                    this.style.y += this.speed.y ;
                    this.style.x += this.speed.x ;
                break;
            }
        } ;

        this.collisionHandler = ( objects ) => {
            for( let object of objects ) {
                switch( object.id ) {
                    case "playerA":
                        if( this.direction.indexOf( 'up' ) !== -1 )
                            this.direction = 'up-right' ;
                        else
                            this.direction = 'down-right' ;

                        this.randomSpeed() ;
                    break ;

                    case "playerB":
                        if( this.direction.indexOf( 'up' ) !== -1 )
                            this.direction = 'up-left' ;
                        else
                            this.direction = 'down-left' ;

                        this.randomSpeed() ;
                    break;

                    case "stageTop":
                        if( this.direction.indexOf( 'right' ) !== -1 )
                            this.direction = 'down-right' ;
                        else
                            this.direction = 'down-left' ;
                    break ;

                    case "stageBottom":
                        if( this.direction.indexOf( 'right' ) !== -1 )
                            this.direction = 'up-right' ;
                        else
                            this.direction = 'up-left' ;
                    break ;

                    case "stageRight":
                        Pong.score.playerA++ ;
                        Pong.updateScore() ;
                        this.randomStart( "left" ) ;
                    break ;

                    case "stageLeft":
                        Pong.score.playerB++ ;
                        Pong.updateScore() ;
                        this.randomStart( "right" ) ;
                    break ;
                }
            }
        } ;

        this.id = id ;
        this.style.width = this.style.height = 10 ;
        this.style.fill = { color: "#FFFFFF" } ;
        this.addUpdateHanlder( this.autoUpdateDirection ) ;
        this.addCollisionHanlder( this.collisionHandler ) ;
    }

    build() {
        let context = this._context ;
        context.rect( this.style.x, this.style.y, this.style.width, this.style.height ) ;
        this.applyStyle() ;
    }

    randomStart( x_direction = 'left' ) {
        let quarter_y = this._context.canvas.height / 4 ;
        let y_direction = ['up', 'down'][Util.getRandInteger( 0, 1 )] ;
        
        Object.assign( this.style, {
            x: ( this._context.canvas.width / 2 ) - ( this.style.width / 2 ),
            y: Util.getRandInteger( quarter_y, this._context.canvas.height - quarter_y ),
        });

        this.speed = { x: 5, y: 5 } ;
        this.direction = "paused" ;
        
        setTimeout(() => {
            this.direction = y_direction + '-' + x_direction ;
        }, 150 ) ;
    }

    randomSpeed() {
        this.speed = {
            x: Util.getRandInteger( 5, 10 ),
            y: Util.getRandInteger( 5, 10 )
        } ;
    }
}

class GameStageLimit extends GameObject {
    constructor( id ) {
        super() ;
        this.id = id ;
    }
    build() {
        let context = this._context ;
        context.rect( this.style.x, this.style.y, this.style.width, this.style.height ) ;
        this.applyStyle() ;
    }
}

class GameDashedLine extends GameObject {
    constructor( id ) {
        super() ;

        this.id = id ;
        this.style.width = 1 ;
        this.style.stroke = { color: "#FFFFFF" } ;
    }

    build() {
        let context = this._context ;
        context.setLineDash( [ 5, 15 ] ) ;
        context.lineWidth = this.style.width ;
        context.moveTo( ( context.canvas.width / 2 ), 0) ;
        context.lineTo( ( context.canvas.width / 2 ), context.canvas.height ) ;
        this.applyStyle() ;
    }
}






/*********************************
    GAME PLAYER DECORATORS
      ( BOT AND PLAYER )
*********************************/
var PlayerBarBotMode = {
    idle: "idle",
    attack: "attack"
} ;

var PlayerBarBotDifficult = {
    ease: 0.5,
    medium: 0.6,
    hard: 0.85
} ;

class PlayerBarBot {
    constructor( _bar, _ball, _canvas ) {
        this._bar = _bar ;
        this._ball = _ball ;
        this._canvas = _canvas ;
        this._mode = PlayerBarBotMode.idle ;
        this._difficult = PlayerBarBotDifficult.medium ;

        this.bot = () => {
            switch( this._mode ) {
                case PlayerBarBotMode.idle:
                    this.idle() ;
                break ;

                case PlayerBarBotMode.attack:
                    this.attack() ;
                break;
            }
        } ;

        this.idle = () => {
            this._bar.speed = 3 ;
            if( this._bar.style.y <= 5 )
                this._bar.direction = "down" ;
            
            if( this._bar.style.y >= ( this._canvas.height - 5 - this._bar.style.height ) )
                this._bar.direction = "up" ;
            
            this.autoUpdateDirection() ;
        } ;

        this.attack = () => {
            if( this._ball.style.y > ( this._bar.style.y + ( this._bar.style.height / 2 ) ) )
                this._bar.direction = "down" ;
            else
                this._bar.direction = "up" ;

            this._bar.speed = this._ball.speed.y * this._difficult ;
            
            if( this._bar.style.y <= 5 )
                this._bar.style.y = 5 ;

            if( this._bar.style.y >= this._canvas.height - this._bar.style.height - 5 )
                this._bar.style.y = this._canvas.height - this._bar.style.height - 5 ;
            
            this.autoUpdateDirection() ;
        };

        this.autoUpdateDirection = () => {
            switch( this._bar.direction ) {
                case "up":
                    this._bar.style.y -= this._bar.speed ;
                break ;

                case "down":
                    this._bar.style.y += this._bar.speed ;
                break ;
            }
        } ;

        this.ballObserver = () => {
            var side = this._bar.style.x < ( this._canvas.width / 2 ) ? 'left' : 'right' ;

            if ( ( this._ball.style.x >= ( this._canvas.width / 2 ) && side == 'right' )
                || ( this._ball.style.x <= ( this._canvas.width / 2 ) && side == 'left' ) )
                this.setMode( PlayerBarBotMode.attack ) ;
            else
                this.setMode( PlayerBarBotMode.idle ) ;
        } ;

        _bar.addUpdateHanlder( this.bot ) ;
        _ball.addUpdateHanlder( this.ballObserver ) ;
    }

    setMode( mode ) {
        this._mode = mode ;
    }

    setDifficult( difficult ) {
        this._difficult = difficult ;
    }
}

class PlayerBarUser {
    constructor( _bar, _canvas ) {
        this._bar = _bar ;
        this._canvas = _canvas ;
        this.startMouseControl() ;
    }

    startMouseControl() {
        this._canvas.onmousemove = ( event ) => {
            this._bar.style.y = event.offsetY - ( this._bar.style.height / 2 ) ;
            
            if( this._canvas ) {
                if( this._bar.style.y <= 5 )
                    this._bar.style.y = 5 ;
                
                if( this._bar.style.y >= this._canvas.height - this._bar.style.height - 5 )
                    this._bar.style.y = this._canvas.height - this._bar.style.height - 5 ;
            }
        } ;
    }
}


/*********************************
    PONG GAME DEFINITION
*********************************/
class Pong extends Game {
    constructor( _canvas, _fps = 60 ) {
        super( _canvas, 700, 400, _fps ) ;

        this._canvas = _canvas ;
        this._fps = _fps ;
        this.createStageColliders() ;
        this.createPlayerElements() ;
        this.createStageElements() ;
        this.addObserver( Collider.getInstance().observer ) ;
    }

    start() {
        this.ball.randomStart() ;
        super.start() ;
    }

    createStageElements() {
        let stageMiddleDashedLine = new GameDashedLine( "stageMiddleDashedLine" ) ;
        // Register Objects
        this.addObject(stageMiddleDashedLine);
    }

    createStageColliders() {
        let collider = Collider.getInstance() ;
        let stageTop = new GameStageLimit( "stageTop" ) ;
        let stageRight = new GameStageLimit( "stageRight" ) ;
        let stageBottom = new GameStageLimit( "stageBottom" ) ;
        let stageLeft = new GameStageLimit( "stageLeft" ) ;

        // Position and sizing
        Object.assign( stageTop.style, { x: 0, y: 0, width: this._canvas.width, height: 5 } ) ;
        Object.assign( stageRight.style, { x: this._canvas.width, y: 0, width: 1, height: this._canvas.height } ) ;
        Object.assign( stageBottom.style, { x: 0, y: this._canvas.height, width: this._canvas.width, height: 5 } ) ;
        Object.assign( stageLeft.style, { x: 0, y: 0, width: 1, height: this._canvas.height } ) ;
        
        // Colliders
        collider.watch( stageTop, stageRight, stageBottom, stageLeft ) ;
        
        // Register Objects
        this.addObject( stageTop, stageRight, stageBottom, stageLeft ) ;
    }

    createPlayerElements() {
        let collider = Collider.getInstance() ;

        this.ball = new PlayerBall( "ball" ) ;
        this.playerA = new PlayerBar( "playerA" ) ;
        this.playerB = new PlayerBar( "playerB" ) ;
        
        // Position and sizing
        Object.assign(this.playerA.style, {
            x: 20,
            y: ( this._canvas.height / 2 ) - ( this.playerA.style.height / 2 )
        });

        Object.assign( this.playerB.style, {
            x: ( this._canvas.width - 30 ),
            y: ( this._canvas.height / 2 ) - ( this.playerB.style.height / 2 )
        });

        // Colliders
        collider.watch( this.ball, this.playerA, this.playerB ) ;
        
        // Register Objects
        this.addObject( this.playerA, this.playerB, this.ball ) ;
        
        // Set Players
        this.playerUser = new PlayerBarUser( this.playerA, this._canvas ) ;
        this.playerBot = new PlayerBarBot( this.playerB, this.ball, this._canvas ) ;
    }

    addUpdateScoreHandler( handler ) {
        Pong._updateScoreHandler.push( handler ) ;
    }

    reset() {
        Pong.score = { playerA: 0, playerB: 0 } ;
        Pong.updateScore() ;
        this.ball.randomStart() ;
        this.resume() ;
    }
}
// Pong static members
Pong._updateScoreHandler = [];
Pong.score = { playerA: 0, playerB: 0 };
Pong.updateScore = () => {
    for (let handler of Pong._updateScoreHandler) {
        handler(Pong.score);
    }
};


/*********************************
    PONG GAME CONTROLLER
*********************************/
class PongController {
    constructor( _canvas ) {
        this.activeView = "NewGame" ;
        this.scoreToWin = 15 ;
        
        this.selectGameDifficult = ( difficult ) => {
            this.pong.playerBot.setDifficult( difficult ) ;
            this.changeActiveView( "GamePlay" ) ;
            this.pong.reset() ;
        } ;

        this.setWinner = ( playerName ) => {
            this.pong.pause() ;
            Util.setElementHTML(".menu .winner > h2 > b", playerName) ;
            this.changeActiveView('Winner') ;
        } ;

        this.updateScore = ( score ) => {
            Util.setElementHTML( ".score.playerA > h1", score.playerA ) ;
            Util.setElementHTML( ".score.playerB > h1", score.playerB ) ;
            
            // Player A won
            if( score.playerA == this.scoreToWin ) {
                this.setWinner(Util.getElementHTML( ".score.playerA > p" ) ) ;
            }

            // Player B won
            if( score.playerB == this.scoreToWin ) {
                this.setWinner( Util.getElementHTML( ".score.playerB > p" ) ) ;
            }
        } ;

        this.changeActiveView = ( view ) => {
            switch( view ) {
                case "NewGame":
                    Util.setElementStyle( ".menu", { display: "block" } ) ;
                    Util.setElementStyle( ".menu > .new", { display: "block" } ) ;
                    Util.setElementStyle( ".menu > .pause", { display: "none" } ) ;
                    Util.setElementStyle( ".menu > .winner", { display: "none" } ) ;
                break ;

                case "PauseGame":
                    Util.setElementStyle( ".menu", { display: "block" } ) ;
                    Util.setElementStyle( ".menu > .new", { display: "none" } ) ;
                    Util.setElementStyle( ".menu > .pause", { display: "block" } ) ;
                    Util.setElementStyle( ".menu > .winner", { display: "none" } ) ;
                break ;

                case "GamePlay":
                    Util.setElementStyle( ".menu", { display: "none" } ) ;
                break ;

                case "Winner":
                    Util.setElementStyle( ".menu", { display: "block" } ) ;
                    Util.setElementStyle( ".menu > .new", { display: "none" } ) ;
                    Util.setElementStyle( ".menu > .pause", { display: "none" } ) ;
                    Util.setElementStyle( ".winner", { display: "block" } ) ;
                break ;
            }

            this.activeView = view ;
        } ;

        this.buildKeyboardEvents = () => {
            document.onkeyup = ( event ) => {
                switch ( event.keyCode ) {
                    case 27:
                        if( this.activeView == "GamePlay" ) {
                            this.pong.pause() ;
                            this.changeActiveView( "PauseGame" ) ;
                        }
                    break ;
                }
            };
        } ;

        this.buildMouseEvents = () => {
            // Start Menu Action
            Util.setElementClick( ".menu .start-ease", () => {
                this.selectGameDifficult( PlayerBarBotDifficult.ease ) ;
            }) ;

            Util.setElementClick( ".menu .start-normal", () => {
                this.selectGameDifficult( PlayerBarBotDifficult.medium ) ;
            }) ;

            Util.setElementClick( ".menu .start-hard", () => {
                this.selectGameDifficult( PlayerBarBotDifficult.hard ) ;
            }) ;

            Util.setElementClick( ".menu .resume-game", () => {
                this.pong.resume() ;
                this.changeActiveView( "GamePlay" ) ;
            }) ;

            Util.setElementClick( ".menu .new-game", () => {
                this.pong.reset() ;
                this.pong.pause() ;
                this.changeActiveView( "NewGame" ) ;
            }) ;
        };

        this.pong = new Pong( _canvas ) ;
    }

    run() {
        this.buildMouseEvents() ;
        this.buildKeyboardEvents() ;
        this.pong.addUpdateScoreHandler( this.updateScore ) ;
        this.pong.start() ;
    }
}



/*********************************
    PONG GAME EXECUTION
*********************************/
let $canvas = document.querySelector( 'canvas' ) ;
let gamePong ;

if ( $canvas != null ) {
    gamePong = new PongController( $canvas ) ;
    gamePong.run() ;
}
else {
    alert("Your browser doesn't support canvas");
}