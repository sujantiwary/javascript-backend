class ApiResponse{
    constructor(success, data, message="Success"){
        this.success = success
        this.data = data
        this.message = message
        this.success = success<400
    }
}
export {ApiResponse}