import {NodeGroup} from "@/visual/NodeGroup";
import {DebugNodeJuggler, NodeTracker} from "@/helpers/data/NodeTracker";
import {NodeEvent} from "@/helpers/NodeEvent";
import {LastBlockDataSource, NetworkDataSource, NodeDataSource} from "@/helpers/data/URLDataSource";
import {Config} from "@/config";
import {clearObject} from "@/helpers/3D";
import {emitter, EventTypes} from "@/helpers/EventTypes";
import {NodeSet} from "@/helpers/data/NodeSet";
import {DataStorage} from "@/helpers/data/Storage";

export class MainScene {
    constructor(scene, camera) {
        this.scene = scene
        this.camera = camera
        this.prevNodes = new NodeSet([], false)
        this.nodes = new NodeSet([], false)

        this.nodeGroup = new NodeGroup(this.scene)

        this._firstTime = true
        this._runDataSource()

        this._fullyLoaded = false

        this._nodeJuggler = new DebugNodeJuggler(3)
        this._nodeJuggler.enabled = Config.DataSource.NodeJuggler.Enabled

        // this._debugSection()
    }

    _runDataSource() {
        this._dataSources = []

        const cfg = Config.DataSource

        const nodeDataSource = new NodeDataSource(cfg.THORNodeURL, cfg.Nodes.PollPeriod)
        nodeDataSource.callback = this.handleData.bind(this)
        nodeDataSource.run()

        const lastBlockSource = new LastBlockDataSource(cfg.THORNodeURL, cfg.LastBlock.PollPeriod)
        lastBlockSource.callback = (lastBlock) => {
            DataStorage.lastBlock = lastBlock
        }
        lastBlockSource.run()

        const networkSource = new NetworkDataSource(cfg.MidgardURL, cfg.Network.PollPeriod)
        networkSource.callback = (networkInfo) => {
            console.log(networkInfo)
            if(DataStorage.lastBlock) {
                emitter.emit(EventTypes.NodeChurnUpdate, {
                    ...networkInfo,
                    lastBlock: DataStorage.lastBlock
                })
            }
        }
        networkSource.run()

        this._dataSources.push(nodeDataSource, lastBlockSource, networkSource)
    }

    handleData(nodes) {
        if (!nodes) {
            console.error('No nodes to handle!')
            return
        }

        if (!this._fullyLoaded) {
            this._fullyLoaded = true
            console.log('[EV] Fully loaded!')
            emitter.emit(EventTypes.FullyLoaded)
        }

        nodes = this._nodeJuggler.handleNodes(nodes)

        DataStorage.lastNodes = nodes

        emitter.emit(EventTypes.DataSourceTick, nodes)

        this.prevNodes = this.nodes
        this.nodes = nodes
        const tracker = new NodeTracker(this.prevNodes, this.nodes)
        const events = tracker.extractEvents()

        console.info(`Handle Data tick! Total: ${events.length} events.`)

        for (const event of events) {
            const node = event.node
            if (node.address) {
                if (event.type === NodeEvent.EVENT_TYPE.CREATE) {
                    this.nodeGroup.createNewNode(node, nodes)
                } else if (event.type === NodeEvent.EVENT_TYPE.DESTROY) {
                    this.nodeGroup.destroyNode(node)
                } else {
                    this.nodeGroup.reactEvent(event)
                }
            }
        }

        if (this._firstTime) {
            for (let i = 0; i < Config.Physics.Startup.SimulationSteps; ++i) {
                this.nodeGroup.update(Config.Physics.Startup.DeltaTime)
            }
            this._firstTime = false
        }

        if (events.length) {
            emitter.emit(EventTypes.Activity)
        }
    }

    update(delta) {
        this.nodeGroup.update(delta)
        this.nodeGroup.updateFromCamera(this.camera)
    }

    dispose() {
        for(const source of this._dataSources) {
            source.stop()
        }
        this._dataSources = []

        this.nodeGroup.dispose()
        clearObject(this.scene)
    }

    findNodeByAddress(address) {
        return this.nodes.byAddress[address]
    }

    pick(name) {
        const node = this.findNodeByAddress(name)
        console.log(node)
    }
}
