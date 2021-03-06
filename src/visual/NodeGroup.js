import {Random} from "@/helpers/MathUtil";
import {NodeObject} from "@/visual/NodeObject";
import {NodeEvent} from "@/helpers/NodeEvent";
import {clearObject} from "@/helpers/3D";
import {Config} from "@/config";
import {Simulation} from "@/helpers/physics/Simulation";
import {ModeNormal} from "@/visual/modes/ModeNormal";
import {ModeStatus} from "@/visual/modes/ModeStatus";
import {ModeProvider} from "@/visual/modes/ModeProvider";
import {ModeVersion} from "@/visual/modes/ModeVersion";
import {ModeBond} from "@/visual/modes/ModeBond";

export const NodeGroupModes = Object.freeze({
    Normal: 'normal',
    Status: 'status',
    Provider: 'provider',
    Version: 'version',
    Bond: 'bond',
})

export class NodeGroup extends Simulation {
    constructor(parent) {
        super()

        this._currentIdent = 0
        this.parent = parent

        this._modeNormal = new ModeNormal(this.parent)
        this._modeStatus = new ModeStatus(this.parent)
        this._modeProvider = new ModeProvider(this.parent)
        this._modeVersion = new ModeVersion(this.parent)
        this._modeBond = new ModeBond(this.parent)

        this._selector = {
            [NodeGroupModes.Normal]: this._modeNormal,
            [NodeGroupModes.Status]: this._modeStatus,
            [NodeGroupModes.Provider]: this._modeProvider,
            [NodeGroupModes.Version]: this._modeVersion,
            [NodeGroupModes.Bond]: this._modeBond,
        }

        this._selectedModeHandler = this._modeNormal
        this.mode = NodeGroupModes.Normal

        this._startPositionBounds = {
            xMin: -60, xMax: 60,
            yMin: -40, yMax: 40,
            zMin: 0, zMax: 0,
        }
        this.repelForce = Config.Physics.RepelForce
    }

    genIdent(node) {
        return node.node_address ?? String(this._currentIdent++)
    }

    _placeNodeObject(nodeObject) {
        // const pos = Random.randomVector(this._startPositionBounds)
        const pos = Random.randomOnCircle(2000.0)
        nodeObject.o.position.copy(pos)
        this.parent.add(nodeObject.o)
    }

    createNewNode(node) {
        const ident = this.genIdent(node)
        const existing = this.getByName(ident)
        if (existing) {
            console.warn('NodeObject already exists. No nothing')
            return existing
        }

        console.info(`Create node ${ident}.`)

        const nodeObject = new NodeObject(node)
        this.parent.add(nodeObject.o)
        this._placeNodeObject(nodeObject)
        this.addObject(ident, nodeObject)
        return nodeObject
    }

    destroyNode(node) {
        const nodeAddress = node.node_address ?? node
        const nodeObject = this.getByName(nodeAddress)
        if (!nodeObject) {
            console.error('node not found!')
            return
        }

        console.info(`Destroy node ${nodeAddress}.`)
        nodeObject.dispose()
        this.parent.remove(nodeObject.o)
        super.removeObject(nodeAddress)
    }

    set mode(newMode) {
        if(this._mode === newMode) {
            return
        }

        this._mode = newMode

        // dispose old
        this._selectedModeHandler.onLeave(this.nodeObjList)

        // pick new
        this._selectedModeHandler = this._selector[this._mode]

        // enter the new one
        this._selectedModeHandler.onEnter(this.nodeObjList)

        console.log(`Set Mode: ${newMode}`)
    }

    _updateObject(obj, delta) {
        this._selectedModeHandler.handleObject(obj)
        super._updateObject(obj, delta)
    }

    reactEvent(event) {
        const delay = Random.getRandomFloat(0, Config.DataSource.ReactRandomDelay * 1000.0)
        setTimeout(() => {
            const obj = this.getByName(event.node.node_address)
            if (obj) {
                if (event.type === NodeEvent.EVENT_TYPE.OBSERVE_CHAIN) {
                    obj.reactChain()
                } else if (event.type === NodeEvent.EVENT_TYPE.SLASH) {
                    obj.reactSlash()
                }
            }
        }, delay)
    }

    update(dt) {
        this._selectedModeHandler.update(dt)
        return super.update(dt);
    }

    dispose() {
        super.dispose()
        clearObject(this.parent)
        for (const otherObj of this.nodeObjList) {
            otherObj.dispose()
        }
    }
}