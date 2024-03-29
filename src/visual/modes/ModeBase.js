import {TitleLabel3D} from "@/visual/TitleLabel3D";
import _ from "lodash";
import {Random} from "@/helpers/MathUtil";
import TWEEN from "tween.js";

export class ModeBase {
    constructor(scene) {
        this.scene = scene
        this.active = false
        this.isFlat = true
        this._labelsHash = {}
    }

    handleObject(physObj) {
        +physObj // do nothing
    }

    reactEvent(event, nodes) {
        +event;
        +nodes
    }

    makeLabel({
                  text,
                  position,
                  scale = 20,
                  rotation = -45.0,
                  bb = false,
                  key = null,
                  moveIfExists = true
              }) {
        if (!text || text === '') {
            return
        }

        key = key || Random.generateId()

        const label = this.findLabelByKey(key)
        if(label && label.text !== text) {
            console.log(`Updating label ${key} from ${label.text} to ${text}`)
            label.updateText(text)
        }

        if (moveIfExists) {
            if (label) {
                new TWEEN.Tween(label.position)
                    .to(position, 1000.0)
                    .easing(TWEEN.Easing.Sinusoidal.InOut)
                    .start();
                return label
            }
        }

        const titleLabel = new TitleLabel3D(text, scale, rotation, bb)
        titleLabel.key = key

        titleLabel.position.copy(position)
        this.scene.add(titleLabel)

        this._labelsHash[key] = titleLabel

        return titleLabel
    }

    onEnter() {
    }

    _triggerOnEnter(a, b) {
        this.onEnter(a, b)

        this.active = true
        _.values(this._labelsHash).forEach(label => label.animateIn())
    }

    onLeave() {
    }

    _triggerOnLeave(a, b) {
        this.onLeave(a, b)

        this.active = false
        this.clearLabels()
    }

    findLabelByKey(key) {
        return this._labelsHash[key]
    }

    killLabelByKey(key) {
        console.log(`Killing label ${key}.`)
        const label = this.findLabelByKey(key)
        if (label) {
            label.animateOut(true)
            delete this._labelsHash[key]
        }
    }

    clearLabels() {
        _.values(this._labelsHash).forEach(label => label.animateOut(true))

        this._labelsHash = {}
    }

    update(dt) {
        +dt
    }

    dispose() {}
}