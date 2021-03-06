import * as THREE from "three";
import {NodeGroup} from "@/visual/NodeGroup";
import {NodeTracker} from "@/helpers/NodeTracker";
import {NodeEvent} from "@/helpers/NodeEvent";
import {URLDataSource} from "@/helpers/data/URLDataSource";
import {Config} from "@/config";
import {clearObject} from "@/helpers/3D";
import {IPAddressInfoLoader} from "@/helpers/data/IPAddressInfo";
import {emitter, EventTypes} from "@/helpers/EventTypes";

export class MainScene {
    constructor(scene, vueComp) {
        this.scene = scene
        this.vueComp = vueComp
        this.prevNodes = []
        this.nodes = []

        this._makeSomeLight()
        this.nodeGroup = new NodeGroup(this.scene)

        this._firstTime = true
        this._runDataSource()
    }

    _runDataSource() {
        this.dataSource = new URLDataSource(Config.DataSource.NodesURL, Config.DataSource.PollPeriod)
        this.dataSource.callback = (data) => {
            this.handleData(data)
        }

        this.dataSource.run()

        this.ipAddressLoader = new IPAddressInfoLoader()
    }

    _makeSomeLight() {
        const light = new THREE.DirectionalLight('hsl(0, 100%, 100%)')
        light.position.set(0, 10, 1000)
        this.scene.add(light)

        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(ambientLight);
    }

    async _loadAdditionalInfoAbout(obj) {
        const ipAddress = obj.node.ip_address
        if(ipAddress) {
            obj.ipInfo = await this.ipAddressLoader.load(ipAddress)
        }
    }

    handleData(nodes) {
        console.info('Handle Data tick!')

        emitter.emit(EventTypes.DataSourceTick, nodes)

        // Random.removeRandomItem(nodes)

        this.prevNodes = this.nodes
        this.nodes = nodes
        const tracker = new NodeTracker(this.prevNodes, this.nodes)
        const events = tracker.extractEvents()

        for (const event of events) {
            const node = event.node
            if (node.node_address) {
                if (event.type === NodeEvent.EVENT_TYPE.CREATE) {
                    const obj = this.nodeGroup.createNewNode(node)
                    this._loadAdditionalInfoAbout(obj).then()
                } else if (event.type === NodeEvent.EVENT_TYPE.DESTROY) {
                    this.nodeGroup.destroyNode(node)
                } else {
                    this.nodeGroup.reactEvent(event)
                }
            }
        }

        if(this._firstTime) {
            for(let i = 0; i < Config.Physics.Startup.SimulationSteps; ++i) {
                this.nodeGroup.update(Config.Physics.Startup.DeltaTime)
            }
            this._firstTime = false
        }

        if (events.length && this.vueComp) {
            this.vueComp.pokeActivity()
        }
    }

    update(delta) {
        this.nodeGroup.update(delta)
    }

    dispose() {
        this.dataSource.stop()
        this.nodeGroup.dispose()
        clearObject(this.scene)
    }
}