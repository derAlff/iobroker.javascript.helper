/*  Helper
    Version:    1.2.1
    Author:     Oliver Alff
    Erstellt:   27.01.2022

    ToDo:
    - Make SQL usable. Example: 
        const test = () =>{
            console.log('RUN!');
            let sQry = `DELETE FROM meters.meter_types WHERE meter_types.id=4`;

            sendTo('sql.0', 'query', sQry, function (result) {
                if (result.error) {
                    console.error(result.error);
                } else {
                    // show result
                    console.log('Rows: ' + JSON.stringify(result.result));
                }
            });
            console.log('END!');
        }

        test();
        
    History:
        - 27.01.2022    - Created this Script
                        - Added function debug()
                        - Added function log()
                        - Added function warn()
                        - Added function error()
        - 28.01.2022    - Added function 'addDatapointIfNotExistsAsync()' to create missing states
                        - Added global variable 'classDebug' to debug the class
                        - Added function 'getRoomsAsync()'
                        - Added function 'roomListToArray()'
                        - Added function 'turnLightListOn()'
                        - Added function 'turnLightListOff()'
        - 04.02.2022    - Changed 'if-else' in 'getRoomsAsync()' - Added 'debug === undefined ||'
*/
const lampMap = {
    lampManufacturer: [
        "shelly",
        "tasmota"
    ],
    map: {
        shelly: {
            on: true,
            off: false,
            dimMax: 100
        },
        tasmota: {
            on: 'true',
            off: 'false',
            dimMax: 100
        }
    }
};

enum Loglevel {
    "debug" = 0,
    "info" = 1,
    "warning" = 2,
    "error" = 3
}

// @ts-ignore
class Helper{
    classDebug = false;
    
    /**
     * Helper function to do a log to console/logfile
     * @param message Logmessage
     * @param Loglvl Loglevel to write (debug, info, warning, error)
     */
    public doLog(message: String, Loglvl: any){

        if(Loglvl === Loglevel.debug)
        {
            console.debug(message);
        }
        else if(Loglvl === Loglevel.info){
            console.log(message);
        }
        else if(Loglvl === Loglevel.warning){
            console.warn(message);
        }
        else if(Loglvl === Loglevel.error){
            console.error(message);
        }

    }

    /**
     * Helper function to write to debug-log
     * @param text Text to write to debug-log
     * @param debug Debugging true/false/undefindes
     */
    public debug(text: string, debug?: boolean){

        if(debug !== undefined || this.classDebug)
        {
            if(debug)
            {
                console.debug(text);
            }
        }       
    }

    /**
     * Helper function to write to log
     * @param text Text to write to log
     * @param debug Debugging true/false/undefindes
     */
    public log(text: string, debug?: boolean){
        if(debug === undefined || this.classDebug)
        {
            this.debug(text, true);
        }
        else{
            console.log(text);
        }
    }

    /**
     * Helper function to write to warn-log
     * @param text Text to write to warn-log
     * @param debug Debugging true/false/undefindes
     */
    public warn(text: string, debug?: boolean){
        if(debug !== undefined || this.classDebug)
        {
            this.debug(text, true);
        }
        else{
            console.warn(text);
        }
    }

    /**
     * Helper function to write to error-log
     * @param text Text to write to error-log
     * @param debug Debugging true/false/undefindes
     */
    public error(text: string, debug?: boolean){
        if(debug !== undefined || this.classDebug)
        {
            this.debug(text, true);
        }
        else{
            console.error(text);
        }
    }

    /**
     * Helper function to converts text to boolean
     * @param value string: On or Off uppercase or lowercase
     * @returns true|false
     */
    public stringToBool(value: string)
    {
        switch(value.toLowerCase()){
            case("off"): return false;
            case("on"): return true;
        }
    }

    /**
     * Helper function to add datapoints asynchrone
     * @param objPath Path to new object.
     * @param objName Name of the new object (optional). Std: objPath.
     * @param objType Type of the new object (optional). Std 'string'.
     * @param objRole Role of the new object (optional). Std: 'value'.
     * @param debug Debug true/false/undefined.
     * @returns true/false
     */
    public async addDatapointIfNotExistsAsync(objPath: string, objName?:string, objType?: string, objRole?: string, objUnit?: string, debug?: boolean){
        let sFunctionName = 'addDatapointIfNotExists()'
        
        if(debug === undefined || this.classDebug)
        {
            debug = this.classDebug;
        }
        
        this.debug(`Started '${sFunctionName}'`, debug);

        return new Promise(async (resolve, rejected) => {
            //@ts-ignore
            let objExists = await existsStateAsync(objPath);
            // Does the object exists? If not -> create!
            if(!objExists)
            {
                this.debug(`The state '${objPath}' do not exists!`, debug);
                this.debug(`Create object '${objPath}'.`, debug);

                let oType;
                let oName;
                let oRole;
                let bReturnVal = false;
                let oDefaultVal;

                // Is the name set?
                if(objName === undefined || objName.length == 0)
                {
                    this.debug(`The variable 'objName' is not set.`, debug);
                    this.debug(`Set the value from 'objName' to 'objPath'.`, debug);
                    oName = objPath;
                }
                else{
                    oName = objName;
                }

                // Is the type set?
                if(objType === undefined || objType.length == 0)
                {
                    this.debug(`The variable 'objType' is not set.`, debug);
                    this.debug(`Set the value from 'objType' to 'string'.`, debug);
                    oType = 'string';
                }
                else{
                    oType = objType;
                }
                
                // Is the role set?
                if(objRole === undefined || objRole.length == 0)
                {
                    this.debug(`The variable 'objRole' is not set.`, debug);
                    this.debug(`Set the value from 'objRole' to 'value'.`, debug);
                    oRole = 'value';
                }
                else{
                    oRole = objRole;
                }

                switch(oType){
                    case 'boolean': oDefaultVal = false;
                    break;
                    case 'string': oDefaultVal = 'false';
                    break;
                    case 'number': oDefaultVal = 0;
                    break;
                    case 'multistate': oDefaultVal = false;
                    break; 
                    case 'mixed': oDefaultVal = false;
                    break;
                }

                // Create the state/object
                //@ts-ignore
                await createStateAsync(objPath, {
                    name: oName,
                    type: oType,
                    role: oRole,
                    read: true,
                    write: true,
                    unit: objUnit,
                    def: oDefaultVal
                });

                // Exists the state now?
                //@ts-ignore
                let bNewObjectExists = await existsStateAsync(objPath);
                if(bNewObjectExists)
                {
                    this.debug(`The state '${objPath}' created successfully.`, debug);
                    bReturnVal = true;
                }
                else{
                    this.debug(`The state '${objPath}' was not created successfully.`, debug);
                    bReturnVal = false;
                }

                resolve(bReturnVal);
            }
            else{
                this.debug(`The state '${objPath}' already exists!`, debug);
                resolve(true);
                rejected(`Error in function '${sFunctionName}'`);
            }

            this.debug(`Ended '${sFunctionName}'`, debug);
        });
        
    }

    /**
     * Function to calculate all devices inside a room
     * @param thisRoom Path to the rooms where want get informations 
     * @param rooms Root path to room ('rooms'!)
     * @param debug Optional to debug inside the function
     * @returns Object of devices in a room
     */
    public async getRoomsAsync(thisRoom: string, rooms?: string, debug?: boolean){
        const sFunctionName = 'getRoomsAsync';
        
        // If debug is not set, then use classDebug
        if(debug === undefined || this.classDebug)
        {
            debug = this.classDebug;
        }

        this.debug(`Started function ${sFunctionName}`, debug);

        return new Promise((response, rejected) => {
            try{
                let aRooms = [];

                if(rooms === undefined || rooms.length === 0)
                {
                    this.debug(`Variable 'rooms' is 'undefined' or 'length' is 0.`, debug);
                    this.debug(`Set variable 'rooms' to string 'rooms'`, debug);
                    rooms = 'rooms';
                }

                this.debug(`Get rooms/enums`, debug);
                //@ts-ignore
                aRooms = getEnums(rooms);
                let aReturnRooms = [];
    
                this.debug(`Iteriate through aReturnRooms`, debug);
                aRooms.forEach(element => {
                    let jRoom = element;
                    // @ts-ignore
                    if(jRoom.id === thisRoom)
                    {   
                        this.debug(`Found room '${thisRoom}' in enums of rooms`, debug);
                        // @ts-ignore
                        jRoom.members.forEach(member => {
                            this.debug(`Push '${member}' to 'aReturnRooms'`, debug);
                            // @ts-ignore
                            aReturnRooms.push(member)
                        });
                        
                    }
                });
    
                this.debug(`Found rooms: `, debug);
                aReturnRooms.forEach(rm => {
                    this.debug(rm, debug);
                });
    
                response(aReturnRooms);
            }
            catch(error)
            {
                rejected(error);
            }
            
            this.debug(`Ended function ${sFunctionName}`, debug);
        });
    }

    /**
     * Converts an object with devices to an array of devices in a room
     * @param oRoomList Object of devices inside a room (from getRoomsAsync())
     * @param debug Optional to debug inside the function
     * @returns Array of devices in a room
     */
    public roomListToArray(oRoomList, debug?: boolean) {
        const sFunctionName = 'turnLightListOn()';
        this.debug(`Started function ${sFunctionName}`, debug)

        if(debug === undefined || this.classDebug)
        {
            debug = this.classDebug;
        }

        //var xyz = {};
        // @ts-ignore
        var xyz = oRoomList;
        var aRoomMembers = [];

        xyz.forEach(rm => {
            this.debug(rm, debug);
            // @ts-ignore
                aRoomMembers.push(rm);
            });

            this.debug(aRoomMembers.length.toString(), debug);

        aRoomMembers.forEach(m => {
            //@ts-ignore
            var obj = getObject(m);
            //@ts-ignore
            this.debug(obj, debug);
            // @ts-ignore
            var objType = obj.common.type;
            this.debug(objType, debug);
        });

        this.debug(`Ended function ${sFunctionName}`, debug)
        return aRoomMembers;
    }

    /**
     * Turn on all lights (states) in an array
     * @param aLights Array with lights to turn off
     * @param debug oplional debug informations from function
     */
    public turnLightListOn(aLights, debug?: boolean){
        const sFunctionName = 'turnLightListOn()';
        this.debug(`Started function ${sFunctionName}`, debug)

        if(debug === undefined || this.classDebug)
        {
            debug = this.classDebug;
        }

        this.debug(`length of aMembers: ${aLights.length}`, debug);
    
        aLights.forEach(member => {
            //@ts-ignore
            var obj = getObject(member);
            var sStateType = '';
            var stateValue;

            this.debug(`Search state type from '${member}'`, debug);
            sStateType = obj.common.type;

            if(sStateType.length > 0)
            {
                this.debug(`Found state type '${sStateType} for '${member}''`, debug);
                switch(sStateType)
                {
                    case 'string': stateValue = 'true';
                    break;
                    case 'boolean': stateValue = true;
                    break;
                }

                this.debug(`Set value of '${member}' with '${stateValue}' from type '${typeof(stateValue)}'`, debug);
                //@ts-ignore
                setState(member, stateValue);
            }
            else{
                this.debug(`Can not find a state type for '${member}'`, debug);
            }
        });

        this.debug(`Ended function ${sFunctionName}`, debug);
    }

    /**
     * Turn off all lights (states) in an array
     * @param aLights Array with lights to turn off
     * @param debug oplional debug informations from function
     */
    public turnLightListOff(aLights, debug?: boolean){
        const sFunctionName = 'turnLightListOff()';
        this.debug(`Started function ${sFunctionName}`, debug);

        if(debug === undefined || this.classDebug)
        {
            debug = this.classDebug;
        }

        this.debug(`length of aMembers: ${aLights.length}`, debug);
    
        aLights.forEach(member => {
            //@ts-ignore
            var obj = getObject(member);
            var sStateType = '';
            var stateValue;

            this.debug(`Search state type from '${member}'`, debug);
            sStateType = obj.common.type;

            if(sStateType.length > 0)
            {
                this.debug(`Found state type '${sStateType} for '${member}''`, debug);
                switch(sStateType)
                {
                    case 'string': stateValue = 'false';
                    break;
                    case 'boolean': stateValue = false;
                    break;
                }

                this.debug(`Set value of '${member}' with '${stateValue}' from type '${typeof(stateValue)}'`, debug);
                //@ts-ignore
                setState(member, stateValue);
            }
            else{
                this.debug(`Can not find a state type for '${member}'`, debug);
            }
        });

        this.debug(`Ended function ${sFunctionName}`, debug);
    }

    public turnLightOnOff(dpWallmountedSwitch: string, dpLamp: string, bLampOn: boolean, sTypeOfValue?: string, bLampDebug?: boolean){

        const sFunctionName = 'setLampOnOff()'
        this.debug(`Started '${sFunctionName}' from button '${dpWallmountedSwitch}' with state '${bLampOn}'`, bLampDebug);
        this.debug(`Type of value is '${sTypeOfValue}'`, bLampDebug);

        let bOldState;
        let valToWrite;

        if(sTypeOfValue !== undefined && sTypeOfValue !== '')
        {
            switch(sTypeOfValue.toLowerCase()){
                
                case 'bool': 
                    this.debug(`Convert type to bool`, bLampDebug); 
                    valToWrite = bLampOn;
                break;
                case 'text': 
                    this.debug(`Convert type to text`, bLampDebug); 
                    bLampOn ? valToWrite = "ON" : valToWrite = "OFF";
                break;
                case 'string': 
                    this.debug(`Convert type to string`, bLampDebug); 
                    bLampOn.toString();
                break;
                case 'number': 
                    this.debug(`Convert type to number`, bLampDebug); 
                    bLampOn ? valToWrite = 1 : valToWrite = 0;
                break;
                case 'text-number': 
                    this.debug(`Convert type to text-number`, bLampDebug); 
                    bLampOn ? valToWrite = '1' : valToWrite = '0';
                break;

            }
        }
        else
        {

            this.debug(`'sTypeOfValue' not set. Use bool as value`, bLampDebug);
            valToWrite = bLampOn;

        }
        

        bOldState = getState(dpLamp).val;
        setState(dpLamp, valToWrite);

        if(bOldState !== bLampOn)
        {

            if(getState(dpLamp).val !== bOldState)
            {
            
                this.debug(`Change of '${dpLamp}' isn't successful!`, bLampDebug);
            
            }
            else{
            
                this.debug(`Changed state of lamp '${dpLamp}'`, bLampDebug);
            
            }

        }
        
    }

    /**
     * Shutter up and down
     * @param dpWallmountedSwitch Dataoint of the wallmounted switch
     * @param dpShutter Datapoint of the shutter
     * @param shutterControl Command to control the shutter
     * @param bShutterDebug Optional debugging
     */
    public shutterUpDown(dpWallmountedSwitch: string, dpShutter: string, shutterControl: any, bShutterDebug?: boolean){

        let sFunctionName = 'shutterUpDown()'
        this.debug(`Started function ${sFunctionName}`, bShutterDebug);

        let bControl = true;
        let bControlUp = false;

        if(dpWallmountedSwitch == undefined || dpWallmountedSwitch.length <= 0 || dpWallmountedSwitch == '')
        {

            this.error(`'dpWallmountedSwitch' is null or empty! Value: ${dpWallmountedSwitch}`);
            bControl = false;
            return;

        }
        if(dpShutter == undefined || dpShutter.length <= 0 || dpShutter == '')
        {

            this.error(`'dpShutter' is null or empty! Value: ${dpShutter}`);
            bControl = false;            
            return;

        }
        if(shutterControl == undefined)
        {

            this.error(`'shutterControl' is null or empty! Value: ${shutterControl}`);
            bControl = false;
            return;

        }

        this.debug(`The type of 'shutterControl' is '${typeof(shutterControl)}'`, bShutterDebug);
        if(typeof(shutterControl) == 'number')
        {
            
            if(shutterControl > 0)
            {
                bControlUp = true;

            }
            else if(shutterControl == 0)
            {

                bControlUp = false;

            }

        }
        else if(typeof(shutterControl) == 'string')
        {
            
            if(shutterControl.toLocaleLowerCase() == "up")
            {

                bControlUp = true;

            }
            else if(shutterControl.toLocaleLowerCase() == "down")
            {

                bControlUp = false;

            }

        }
        else if(typeof(shutterControl) == 'boolean')
        {
            
            if(shutterControl)
            {

                bControlUp = true;

            }
            if(!shutterControl)
            {

                bControlUp = false;

            }

        }

        if(bControl)
        {

            this.debug(`Control shutter '${dpShutter}' with value '${bControlUp}'`, bShutterDebug);
            setState(dpShutter, bControlUp);

        }
    }

    /**
     * 
     * @param dpReceiver (String) Datapoint of the signal-cmb.SendMessage
     * @param sMessage (String) The message to send
     * @param bSignalDebug (Boolean) Debug -> Optional
     */
    public async sendSignalMessage(dpReceiver: string, sMessage: string, bSignalDebug?: boolean){

        let sFunctionName = `sendSignalMessage()`;
        this.debug(`Started function ${sFunctionName}`, bSignalDebug);

        try{

            // Check installes signal-cmb instance
            let bSignalInstalled = false;
            bSignalInstalled = await existsObjectAsync(dpReceiver);         
            
            this.debug(`value of 'bSignalInstalled' is '${bSignalInstalled}'`, bSignalDebug);

            if(bSignalInstalled)
            {

                this.debug(`The Signal adapter is installed.`, bSignalDebug);
                setState(dpReceiver, sMessage);
                console.log(`Sent Signal message '${sMessage}' to '${dpReceiver}'`);

            }
            else{

                this.debug(`Datapoint '${dpReceiver}' is not available. Is an instance of this adapter installed? Please check the name if the datapoint!`, bSignalDebug);
                throw new Error(`Datapoint '${dpReceiver}' is not available. Is an instance of this adapter installed? Please check the name if the datapoint!`);
            }
            

        }
        catch(e)
        {

            let sErrorMessage = (e as Error).message;
            console.error(`Error in function ${sFunctionName}: ${sErrorMessage}`);

        }

        this.debug(`Ended function ${sFunctionName}`, bSignalDebug);

    }
}
