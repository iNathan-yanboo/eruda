import Moveable from 'moveable'
import emitter from '../lib/emitter'
import Settings from '../Settings/Settings'
import { Emitter, nextTick, orientation } from '../lib/util'
import { pxToNum } from '../lib/fione'
import evalCss from '../lib/evalCss'

export default class EntryBtn extends Emitter {
  constructor($container) {
    super()

    this._style = evalCss(require('./EntryBtn.scss'))

    this._$container = $container
    this._appendTpl()
    this._makeDraggable()
    this._bindEvent()
    this._registerListener()
  }
  hide() {
    this._$el.hide()
  }
  show() {
    this._$el.show()
  }
  setPos(pos) {
    if (this._isOutOfRange(pos)) {
      pos = this._getDefPos()
    }

    this._$el.css({
      left: pos.x,
      top: pos.y,
    })

    this.config.set('pos', pos)
  }
  getPos() {
    return this.config.get('pos')
  }
  destroy() {
    evalCss.remove(this._style)
    this._unregisterListener()
    this._$el.remove()
  }
  _isOutOfRange(pos) {
    pos = pos || this.config.get('pos')
    const defPos = this._getDefPos()

    return (
      pos.x > defPos.x + 10 || pos.x < 0 || pos.y < 0 || pos.y > defPos.y + 10
    )
  }
  _registerListener() {
    this._scaleListener = () =>
      nextTick(() => {
        if (this._isOutOfRange()) this._resetPos()
      })
    emitter.on(emitter.SCALE, this._scaleListener)
  }
  _unregisterListener() {
    emitter.off(emitter.SCALE, this._scaleListener)
  }
  _appendTpl() {
    const $container = this._$container

    $container.append(require('./EntryBtn.hbs')())
    this._$el = $container.find('.eruda-entry-btn')
  }
  _resetPos(orientationChanged) {
    const cfg = this.config
    let pos = cfg.get('pos')
    const defPos = this._getDefPos()

    if (!cfg.get('rememberPos') || orientationChanged) {
      pos = defPos
    }

    this.setPos(pos)
  }
  _bindEvent() {
    const draggabilly = this._draggabilly
    const $el = this._$el

    draggabilly
        .on('click', () => this.emit('click'))
        .on('dragStart', () => $el.addClass('eruda-active'))
        .on('drag', ({ target, left, top }) => {
          // console.log('onDrag left, top', left, top);
          if (left < 0) {
            left = 0
          }
          if (top < 0) {
            top = 0
          }
          const { clientWidth, clientHeight } = document.documentElement
          const maxX = clientWidth - this._$el.get(0).clientWidth
          const maxY = clientHeight - this._$el.get(0).clientHeight
          if (left > maxX) {
            left = maxX
          }

          if (top > maxY) {
            top = maxY
          }
          target.style.left = `${left}px`;
          target.style.top = `${top}px`;
          // console.log("onDrag translate", dist);
          // target!.style.transform = transform;
        })

    draggabilly.on('dragEnd', () => {
      const cfg = this.config

      if (cfg.get('rememberPos')) {
        cfg.set('pos', {
          x: pxToNum(this._$el.css('left')),
          y: pxToNum(this._$el.css('top')),
        })
      }

      $el.rmClass('eruda-active')
    })

    orientation.on('change', () => this._resetPos(true))
    window.addEventListener('resize', () => this._resetPos())
  }
  _makeDraggable() {
    this._draggabilly = new Moveable(document.body, {
      target: this._$el.get(0),
      draggable: true,
      origin: false,
      hideDefaultLines: true,
    })
  }
  initCfg(settings) {
    const cfg = (this.config = Settings.createCfg('entry-button', {
      rememberPos: true,
      pos: this._getDefPos(),
    }))

    settings
      .separator()
      .switch(cfg, 'rememberPos', 'Remember Entry Button Position')

    this._resetPos()
  }
  _getDefPos() {
    const minWidth = this._$el.get(0).offsetWidth + 10

    return {
      x: window.innerWidth - minWidth,
      y: window.innerHeight - minWidth,
    }
  }
}
