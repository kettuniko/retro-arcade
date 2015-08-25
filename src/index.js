"use strict";

const KEY_NORMAL = 0;
const KEY_SPECIAL = 1;

let AnimatedCounter = React.createClass({
  propTypes: {
    value: React.PropTypes.number.isRequired
  },
  componentDidMount() {
    let node = React.findDOMNode(this.refs.cursor);
    Bacon
        .fromEvent(node, "animationend")
        .onValue(() => node.classList.toggle("bump", false));
  },
  shouldComponentUpdate(nextProps, _) {
    // Animate (update component) only when value changes
    return this.props.value !== nextProps.value;
  },
  componentWillUpdate() {
    React.findDOMNode(this.refs.cursor).classList.toggle("bump", true);
  },
  render() {
    return (
        <span className="counter">
          <span ref="cursor">{this.props.value}</span>
        </span>
    );
  }
});

let Game = React.createClass({
  propTypes: {
    state: React.PropTypes.object.isRequired,
    settings: React.PropTypes.object.isRequired
  },
  render() {
    let {consecutiveSpecialHits, progress, score, blockPosition,
        blockIndex, specialsLeft, blocks} = this.props.state;
    return (
        <div className="player-screen">
          <div className="header">
            <h2>{this.props.settings.name}</h2>
          </div>
          <CodeBox blockPosition={blockPosition}
                   blockIndex={blockIndex}
                   blocks={blocks}/>

          <div className="footer">
            <div className="col">
              <AnimatedCounter value={Math.round(progress)}/>
              <span className="title">Progress</span>
            </div>
            <div className="col">
              <AnimatedCounter value={score}/>
              <span className="title">Score</span>
            </div>
            <div className="col">
              <AnimatedCounter value={consecutiveSpecialHits}/>
              <span className="title">Combo</span>
            </div>
            <div className="col">
              <AnimatedCounter value={specialsLeft}/>
              <span className="title">Specials</span>
            </div>
          </div>
        </div>
    );
  }
});

let UpcomingBlock = React.createClass({
  propTypes: {
    content: React.PropTypes.string.isRequired,
    color: React.PropTypes.string.isRequired
  },
  render() {
      return <span style={{color: this.props.color}}>{this.props.content}</span>;
  }
});

let CodeBox = React.createClass({
  propTypes: {
    blockPosition: React.PropTypes.number.isRequired,
    blockIndex: React.PropTypes.number.isRequired,
    blocks: React.PropTypes.array.isRequired
  },
  componentWillUpdate() {
    let node = this.getDOMNode();
    let cursor = React.findDOMNode(this.refs.cursor);
    if (cursor === null) {
      return;
    }
    this.x = Math.max(0, cursor.offsetLeft - node.offsetLeft - node.clientWidth + 150);
    this.y = Math.max(0, cursor.offsetTop - node.offsetTop - node.clientHeight + 150);
  },
  componentDidUpdate() {
    this.getDOMNode().scrollLeft = this.x;
    this.getDOMNode().scrollTop = this.y;
  },
  render() {
    let {blockPosition, blockIndex, blocks} = this.props;
    let elements = blocks.map((block, index) => {
      let baseColor = index % 2 == 0 ? "black" : "blue";
      let key = "block_" + index;
      if (index == blockIndex) {
        let completed = block.substr(0, blockPosition);
        let cursor = block.substr(blockPosition, 1);
        let left = block.substr(blockPosition + 1);
        return (
            <span key={key} style={{color: baseColor}}>
              <span style={{color: "red"}}>{completed}</span>
              <span style={{backgroundColor: "lime"}} ref="cursor">{cursor}</span>
              <span dangerouslySetInnerHTML={{__html: left}}/>
            </span>
        );
      } else if (index < blockIndex) {
        return <span key={key} style={{color: "red"}}>{block}</span>
      } else {
        // Previous block finished, cursor jumps to current block
        if (blockIndex == index - 1 && blockPosition == blocks[blockIndex].length) {
          return (
              <span key={key} style={{color: baseColor}}>
                <span style={{backgroundColor: "lime"}} ref="cursor">{block.substr(0, 1)}</span>
                <span dangerouslySetInnerHTML={{__html: block.substr(1)}}/>
              </span>
          );
        } else {
          return <UpcomingBlock key={key} color={baseColor} content={block} />;
        }
      }
    });
    return <pre className="code">{elements}</pre>;
  }
});

let Countdown = React.createClass({
  propTypes: {
    value: React.PropTypes.string.isRequired
  },
  render() {
    return (
        <span className="countdown" ref="cursor">{this.props.value}</span>
    );
  }
});

let GamePage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired,
    page: React.PropTypes.object.isRequired
  },
  render() {
    return (
        <div>
          <Countdown value={this.props.page.countdown}/>
          <div className="game">
            {this.props.states.map((p, index) => <Game key={"player_" + index} settings={this.props.settings[index]} state={p}/>)}
          </div>
        </div>
    );
  }
});

let PlayerName = React.createClass({
  propTypes: {
    onchange: React.PropTypes.func.isRequired,
    placeholder: React.PropTypes.string.isRequired
  },
  componentDidMount() {
    Bacon
        .fromEvent(React.findDOMNode(this.refs.input), "keyup")
        .map(e => e.target.value)
        .onValue(this.props.onchange);
  },
  render() {
    return <input placeholder={this.props.placeholder} ref="input" type="text"/>;
  }
});

let MenuPage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired,
    outputs: React.PropTypes.object.isRequired
  },
  render() {
    return (
        <div className="menu">
          <h1>Game Title</h1>
          <div>
            <PlayerName placeholder={this.props.settings[0].name} onchange={this.props.outputs.player1Name}/>
            <PlayerName placeholder={this.props.settings[1].name} onchange={this.props.outputs.player2Name}/>
          </div>
          <ul>
            <li><a href="#game">Start game &gt;</a></li>
            <li><a href="#howto">How to play &gt;</a></li>
          </ul>
        </div>
    );
  }
});

let HowtoPage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired
  },
  render() {
    return (
        <div>
          <div className="howto">
            <h1>How To Play</h1>
            <ol>
              <li>Press &quot;trigger&quot; to advance</li>
              <li>Press &quot;special&quot; when entering highlighted block</li>
              <li>Aim for speed and accuracy</li>
              <li>Profit</li>
            </ol>
            <h2>Player keys</h2>
            <ul>
              {this.props.states.map((s, index) => <li key={index}>{this.props.settings[index].name} trigger: {s.keys.DOWN}, special {s.keys.UP}</li>)}
            </ul>
            <a href="#menu">&lt; Back to main menu</a>
          </div>
        </div>
    );
  }
});

let ScorePage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired
  },
  render() {
    return (
        <div className="score">
          <h1>Game over</h1>
          <ul>
            {this.props.states.map((s, index) =>
                <li key={index}>
                  <h2>{this.props.settings[index].name}</h2>
                  <p className="resultScore">{s.score}</p>
                </li>
            )}
          </ul>
          <a href="#menu">&lt; Back to main menu</a>
        </div>
    );
  }
});

let nextStep = (() => {
  const STEP_MULTIPLIER = 8;
  const SPECIAL_STEP_MULTIPLIER = 32;

  let Movement = {
    indentSkip(block, position) {
      let match = block.substr(position + 1).match(/^(\n|\s{2,})[^\s]/);
      return match != null ? match[1].length : 0;
    },
    jump(step, blocks, index, position) {
      let block = blocks[index];
      // Jump if _cursor_ is at the first character of special block
      // (actual position is last of previous block)
      if (index % 2 == 0 && position == block.length) {
        return [true, step + blocks[index + 1].length];
      }
      // Missed special usage
      return [false, step];
    },
    step(position) {
      return position + 1;
    },
    getPosition(blocks, step) {
      let blockIndex = -1;
      let next = step;
      let remainder;
      do {
        remainder = next;
        blockIndex++;
        next -= blocks[blockIndex].length;
      } while (next > 0);
      return [blockIndex, remainder];
    }
  };

  return (state, keyType) => {
    if (state.step == state.levelLength) {
      return state;
    }

    let currentPosition,
        stepScore = 0,
        consecutiveSpecialHits = state.consecutiveSpecialHits,
        specialsLeft = state.specialsLeft;

    if (keyType == KEY_SPECIAL) {
      let specialHit;
      if (state.specialsLeft > 0) {
        [specialHit, currentPosition] = Movement.jump(state.step, state.blocks, state.blockIndex, state.blockPosition);
      } else {
        [specialHit, currentPosition] = [false, state.step];
      }
      specialsLeft = Math.max(0, state.specialsLeft - 1);
      consecutiveSpecialHits = specialHit ? consecutiveSpecialHits + 1 : 0;
      stepScore = specialHit ? (currentPosition - state.step) * consecutiveSpecialHits * SPECIAL_STEP_MULTIPLIER : 0;
    } else if (keyType == KEY_NORMAL) {
      currentPosition = Movement.step(state.step) + Movement.indentSkip(state.blocks[state.blockIndex], state.blockPosition);
      stepScore = (currentPosition - state.step) * STEP_MULTIPLIER;
    } else {
      throw new Error("Invalid keyType: " + keyType)
    }

    let [blockIndex, blockPosition] = Movement.getPosition(state.blocks, currentPosition);

    return {
      name: state.name,
      keys: state.keys,
      level: state.level,
      levelLength: state.levelLength,
      blocks: state.blocks,
      consecutiveSpecialHits: consecutiveSpecialHits,
      specialsLeft: specialsLeft,
      blockIndex: blockIndex,
      blockPosition: blockPosition,
      step: currentPosition,
      score: state.score + stepScore,
      progress: currentPosition / state.levelLength * 100
    };
  }
})();

function registerKey(key) {
  return Bacon
      .fromEvent(window, "keypress")
      .map(e => e.keyCode)
      .filter(code => String.fromCharCode(code) === key)
      .map(key);
}

// Input config object keys
const UP = 'UP';
const DOWN = 'DOWN';
const LEFT = 'LEFT';
const RIGHT = 'RIGHT';

// Outputs an incremented number when input sequence is advanced
function sequenceStream(keyConfig, sequence) {
  let keySequence = sequence.map(command => keyConfig[command]);
  let keyE = keySequence.map(registerKey);
  return Bacon.mergeAll(keyE)
      .scan({n: 0, loops: 0, seq: keySequence}, (conf, key) => {
        let loops = conf.loops;
        let n = conf.n;
        // Advance sequence only if correct next input given
        if (conf.seq[n] === key) {
          n = (n + 1) % conf.seq.length;
          loops++;
        }
        return {n: n, seq: conf.seq, loops: loops};
      })
      .map(conf => conf.loops)
      .skipDuplicates()
      // Skip initial state as all events trigger cursor movement
      .skip(1);
}

let LEVEL =
    "let <<listener>> = new window.keypress.Listener();\n" +
    "players.forEach(<<player => {\n" +
    "    let step = 0;\n" +
    "    listener.simple_combo(player.trigger, () => {\n" +
    "        player.input.push(++step);\n" +
    "    });\n" +
    "}>>);";
let BLOCKS = LEVEL.split(/<<|>>/);


let player1NameChangeE = new Bacon.Bus();
let player2NameChangeE = new Bacon.Bus();
let outputs = {
  player1Name(name) { player1NameChangeE.push(name) },
  player2Name(name) { player2NameChangeE.push(name) }
};

let activePageP = Bacon.fromEvent(window, "hashchange")
    .toProperty({newURL: window.location.hash})
    .flatMapLatest(e => {
      let parts = e.newURL.split("#");
      var hash = (parts.length == 2) ? "#" + parts[1] : "#menu";
      switch (hash) {
        case "#game":
          return Bacon
              .sequentially(1000, ["3", "2", "1", "CODE!", ""])
              .toProperty("READY?") // immediate start from first countdown element
              .map(c => {
                return {hash: hash, countdown: c};
              });
        default:
          return Bacon.constant({hash: hash});
      }
    })
    .toProperty();

let gameIsActiveP = activePageP.map(page => page.hash === "#game" && page.countdown === "");

let resetStateE = Bacon.mergeAll(
    // Force reset on "Q"
    Bacon.mergeAll(Bacon.once(), registerKey("q")),
    // Reset on menu->game page transition
    activePageP.slidingWindow(2, 2).filter(w => w[0].hash === "#menu" && w[1].hash === "#game")
).map("[reset state]");

let playerSettingsP = Bacon
    .combineAsArray([
      {
        name: player1NameChangeE.toProperty("Player 1")
      },
      {
        name: player2NameChangeE.toProperty("Player 2")
      }
    ].map(Bacon.combineTemplate));

let playerStatesP = Bacon
    .combineAsArray([
      {
        keys: {LEFT: 'a', RIGHT: 'd', DOWN: "s", UP: "w"},
        level: LEVEL,
        levelLength: BLOCKS.join('').length,
        blocks: BLOCKS,
        specialsLeft: 3,
        consecutiveSpecialHits: 0,
        score: 0,
        progress: 0,
        blockIndex: 0,
        blockPosition: 0,
        step: 0
      }, {
        keys: {LEFT: 'h', RIGHT: 'k', DOWN: "j", UP: "u"},
        level: LEVEL,
        levelLength: BLOCKS.join('').length,
        blocks: BLOCKS,
        specialsLeft: 3,
        consecutiveSpecialHits: 0,
        score: 0,
        progress: 0,
        blockIndex: 0,
        blockPosition: 0,
        step: 0
      }
    ].map(Bacon.combineTemplate))
    .sampledBy(resetStateE)
    .flatMapLatest(players => Bacon.combineAsArray(players.map(player => {
      let normalE = sequenceStream(player.keys, [DOWN]);
      let specialE = registerKey(player.keys.UP);
      return Bacon
          .mergeAll(specialE.map(KEY_SPECIAL), normalE.map(KEY_NORMAL))
          .filter(gameIsActiveP)
          .scan(player, nextStep);
    })));

let pageComponentE = activePageP
    .map(page => {
      switch (page.hash) {
        case "#howto":
          return (states, settings) => <HowtoPage states={states} settings={settings}/>;
        case "#game":
          return (states, settings) => <GamePage states={states} page={page} settings={settings}/>;
        case "#score":
          return (states, settings) => <ScorePage states={states} settings={settings}/>;
        default:
          return (states, settings) => <MenuPage states={states} settings={settings} outputs={outputs}/>;
      }
    });

Bacon.onValues(pageComponentE, playerStatesP, playerSettingsP, (template, states, names) => React.render(template(states, names), document.getElementById("main")));

function playersProgressedToEnd(states) {
  return states.reduce((end, s) => s.progress === 100 && end, true);
}

gameIsActiveP
    .and(playerStatesP.map(playersProgressedToEnd))
    .filter(s => s === true)
    .onValue(() => window.location.hash = "#score");
