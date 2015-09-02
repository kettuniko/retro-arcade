"use strict";

import React from "react";
import Bacon from "Bacon";
import classNames from "classNames";

import * as Const from "./const";

function disableClassOnAnimationEnd(ref, className) {
  let node = React.findDOMNode(ref);
  Bacon
      .fromEvent(node, "animationend")
      .onValue(() => node.classList.toggle(className, false));
}

function typeToClassName(type) {
  switch(type) {
    case Const.TYPE_GET_SPECIAL:
      return "block-special-add";
    case Const.TYPE_BONUS:
      return "block-bonus";
    case Const.TYPE_NORMAL:
      return "block-normal";
    default:
      return "";
  }
}

let AnimatedCounter = React.createClass({
  propTypes: {
    value: React.PropTypes.number.isRequired
  },
  componentDidMount() {
    disableClassOnAnimationEnd(this.refs.cursor, "bump");
  },
  shouldComponentUpdate(nextProps) {
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

let Splatter = React.createClass({
  propTypes: {
    value: React.PropTypes.number.isRequired
  },
  componentDidMount() {
    disableClassOnAnimationEnd(this.refs.splash, "splash");
  },
  shouldComponentUpdate(nextProps) {
    // Animate (update component) only when value changes
    return this.props.value !== nextProps.value;
  },
  componentWillUpdate() {
    React.findDOMNode(this.refs.splash).classList.toggle("splash", true);
  },
  render() {
    let text = this.props.value == 0 ? "" : "PERFECT " + this.props.value + "X!";
    return (
        <div className="splatter-container">
          <span ref="splash" className="splatter">{text}</span>
        </div>
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
          <Splatter value={consecutiveSpecialHits}/>
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
              <AnimatedCounter value={specialsLeft}/>
              <span className="title">Specials</span>
            </div>
          </div>
        </div>
    );
  }
});

let PassedBlock = React.createClass({
  propTypes: {
    content: React.PropTypes.string.isRequired,
    animate: React.PropTypes.bool.isRequired,
    type: React.PropTypes.any.isRequired
  },
  componentDidMount() {
    disableClassOnAnimationEnd(this.refs.block, "finish");
  },
  render() {
    let classes = classNames(typeToClassName(this.props.type), {finish: this.props.animate});
    return <span ref="block" style={{color: "red"}} className={classes}>{this.props.content}</span>;
  }
});

let ActiveBlock = React.createClass({
  propTypes: {
    content: React.PropTypes.string.isRequired,
    position: React.PropTypes.number.isRequired,
    onInput: React.PropTypes.func.isRequired,
    type: React.PropTypes.any.isRequired
  },
  componentDidUpdate() {
    let cursor = React.findDOMNode(this.refs.cursor);
    if (cursor === null) {
      return;
    }
    this.props.onInput(cursor.offsetLeft, cursor.offsetTop);
  },
  render() {
    let {content, position} = this.props,
        completed = content.substr(0, position),
        cursor = content.substr(position, 1),
        left = content.substr(position + 1);
    return (
        <span className={typeToClassName(this.props.type)}>
          <PassedBlock animate={false} type={this.props.type} content={completed}/>
          <span style={{backgroundColor: "lime"}} ref="cursor">{cursor}</span>
          <span dangerouslySetInnerHTML={{__html: left}}/>
        </span>
    );
  }
});

let UpcomingBlock = React.createClass({
  propTypes: {
    content: React.PropTypes.string.isRequired,
    type: React.PropTypes.any.isRequired
  },
  render() {
    return <span className={typeToClassName(this.props.type)}>{this.props.content}</span>;
  }
});

let UpcomingNextBlock = React.createClass({
  propTypes: {
    content: React.PropTypes.string.isRequired,
    type: React.PropTypes.any.isRequired
  },
  render() {
    return (
        <span className={typeToClassName(this.props.type)}>
          <span style={{backgroundColor: "lime"}} ref="cursor">{this.props.content.substr(0, 1)}</span>
          <span dangerouslySetInnerHTML={{__html: this.props.content.substr(1)}}/>
        </span>
    );
  }
});

let CodeBox = React.createClass({
  propTypes: {
    blockPosition: React.PropTypes.number.isRequired,
    blockIndex: React.PropTypes.number.isRequired,
    blocks: React.PropTypes.array.isRequired
  },
  onInput(cursorOffsetLeft, cursorOffsetTop) {
    let node = this.getDOMNode();
    let {offsetLeft, offsetTop, clientWidth, clientHeight} = node;
    node.scrollLeft = Math.max(0, cursorOffsetLeft - offsetLeft - clientWidth + 150);
    node.scrollTop = Math.max(0, cursorOffsetTop - offsetTop - clientHeight + 150);
  },
  render() {
    let {blockPosition, blockIndex, blocks} = this.props;
    let elements = blocks.map((block, index) => {
      let key = "block_" + index;
      if (index == blockIndex && blockPosition < blocks[blockIndex].text.length) {
        return <ActiveBlock key={key} type={block.type} onInput={this.onInput} content={block.text} position={blockPosition}/>
      } else if (index <= blockIndex) {
        return <PassedBlock animate={true} type={block.type} content={block.text} key={key}/>
      } else {
        // Previous block finished, cursor jumps to current block
        if (blockIndex == index - 1 && blockPosition == blocks[blockIndex].text.length) {
          return <UpcomingNextBlock key={key} type={block.type} content={block.text} />;
        } else {
          return <UpcomingBlock key={key} type={block.type} content={block.text} />;
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
    return <span className="countdown" ref="cursor">{this.props.value}</span>;
  }
});

let GameTime = React.createClass({
  propTypes: {
    value: React.PropTypes.number.isRequired
  },
  render() {
    return <span className="timeLeft">{this.props.value}</span>;
  }
});

export let GamePage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired,
    page: React.PropTypes.object.isRequired
  },
  render() {
    return (
        <div>
          <Countdown value={this.props.page.countdown}/>
          <GameTime value={this.props.page.timeLeft}/>
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

export let MenuPage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired,
    outputs: React.PropTypes.object.isRequired
  },
  render() {
    return (
        <div className="menu">
          <h1>Arcanecoder</h1>
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

export let HowtoPage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired
  },
  render() {
    return (
        <div className="howto">
          <h1>How To Play</h1>
          <ol>
            <li>Repeat &quot;LEFT&quot; and &quot;RIGHT&quot; to advance</li>
            <li>Press &quot;A&quot; to use AUTOCOMPLETE when entering <span className="block-bonus">keyword</span></li>
            <li>Aim for speed and accuracy</li>
            <li>Profit</li>
          </ol>
          <h2>Player keys</h2>
          <ul>
            {this.props.states.map((s, index) => <li key={index}>{this.props.settings[index].name} LEFT: {s.keys.LEFT}, RIGHT: {s.keys.RIGHT}, A: {s.keys.A}</li>)}
          </ul>
          <h2>Keywords</h2>
          <ul>
            <li><span className="block-bonus">BONUS</span> gives score multiplier only when autocompleted</li>
            <li><span className="block-special-add">AUTOCOMPLETE+1</span> gives one autocomplete command when passed</li>
          </ul>
          <a href="#menu">&lt; Back to main menu</a>
        </div>
    );
  }
});

export let ScorePage = React.createClass({
  propTypes: {
    states: React.PropTypes.array.isRequired,
    settings: React.PropTypes.array.isRequired
  },
  render() {
    let maxScore = this.props.states.reduce((max, state) => Math.max(max, state.score), 0);
    return (
        <div className="score">
          <h1>Game over</h1>
          <ul>
            {this.props.states.map((s, index) => {
                  let classes = classNames('resultScore', {winner: s.score === maxScore});
                  return (
                      <li key={index}>
                        <h2>{this.props.settings[index].name}</h2>
                        <p className={classes}>{s.score}</p>
                      </li>
                  );
                }
            )}
          </ul>
          <a href="#menu">&lt; Back to main menu</a>
        </div>
    );
  }
});

