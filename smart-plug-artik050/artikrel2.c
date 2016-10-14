/*
 * artikrel2.c
 *
 *  Created on: 2016. 10. 5.
 *      Author: 용욱
 */



#include "wiced.h"
#include "mqtt_api.h"
//#include "command_console_wifi.h"
#include "resources.h"
#include "stdlib.h"
#include "lib_itoa.c"
#include "lib_strcmp.c"

/******************************************************
 *                      Macros
 ******************************************************/


#define RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( command, ok_message, error_message )   \
        {                                                                                   \
            ret = (command);                                                                \
            mqtt_print_status( ret, (const char *)ok_message, (const char *)error_message );\
            if ( ret != WICED_SUCCESS ) break;                                              \
        }


/******************************************************
 *                    Constants
 ******************************************************/
/* Change the Broker domain address to match the server address */
#define MQTT_BROKER_ADDRESS                "api.artik.cloud"//"52.200.124.224"//"test.mosquitto.org" //
/* Name of topic name */
#define WICED_TOPIC                         "/v1.1/messages/afe424f3aafd4f6693fe486eb1c77902"//e56c80ae277f48f893a6f50f79db20b0"//"MQTT/WICED/TOPIC"
#define WICED_TOPICSub						"/v1.1/actions/afe424f3aafd4f6693fe486eb1c77902"//e56c80ae277f48f893a6f50f79db20b0"

/* MQTT message content */
//#define WICED_MESSAGE_STR                    "{\"br\":10}" //"HELLO WICED"

/*MQTT Message sub*/
#define aseton								 "{\"actions\":[{\"name\":\"asetOn\",\"parameters\":{}}]}"
#define asetoff								 "{\"actions\":[{\"name\":\"asetOff\",\"parameters\":{}}]}"
#define bseton								 "{\"actions\":[{\"name\":\"bsetOn\",\"parameters\":{}}]}"
#define bsetoff								 "{\"actions\":[{\"name\":\"bsetOff\",\"parameters\":{}}]}"
#define cseton								 "{\"actions\":[{\"name\":\"csetOn\",\"parameters\":{}}]}"
#define csetoff								 "{\"actions\":[{\"name\":\"csetOff\",\"parameters\":{}}]}"


/* MQTT client ID */
#define CLIENT_ID                           "AC_MQTT"

#define WICED_MQTT_TIMEOUT                  (5000)

#define WICED_MQTT_DELAY_IN_MILLISECONDS2     (50)
#define WICED_MQTT_DELAY_IN_MILLISECONDS    (1000)

#define MQTT_MAX_RESOURCE_SIZE              (0x7fffffff)
/******************************************************
 *                   Enumerations
 ******************************************************/

/******************************************************
 *                 Type Definitions
 ******************************************************/

/******************************************************
 *                    Structures
 ******************************************************/

/******************************************************
 *               Function Declarations
 ******************************************************/
static wiced_result_t mqtt_connection_event_cb( wiced_mqtt_object_t mqtt_object, wiced_mqtt_event_info_t *event );
static wiced_result_t mqtt_wait_for( wiced_mqtt_event_type_t event, uint32_t timeout );
static wiced_result_t mqtt_conn_open( wiced_mqtt_object_t mqtt_obj, wiced_ip_address_t *address, wiced_interface_t interface, wiced_mqtt_callback_t callback, wiced_mqtt_security_t *security );
static wiced_result_t mqtt_conn_close( wiced_mqtt_object_t mqtt_object );
static wiced_result_t mqtt_app_subscribe( wiced_mqtt_object_t mqtt_obj, char *topic, uint8_t qos );
static wiced_result_t mqtt_app_unsubscribe( wiced_mqtt_object_t mqtt_obj, char *topic );
static wiced_result_t mqtt_app_publish( wiced_mqtt_object_t mqtt_obj, uint8_t qos, uint8_t *topic, uint8_t *data, uint32_t data_len );

static void mqtt_print_status( wiced_result_t restult, const char * ok_message, const char * error_message );


/******************************************************
 *               Variable Definitions
 ******************************************************/
/*MQTT Configuration*/
static wiced_ip_address_t    broker_address;
static wiced_mqtt_callback_t callbacks = mqtt_connection_event_cb;
static wiced_mqtt_event_type_t expected_event;
static wiced_semaphore_t semaphore;
static wiced_mqtt_security_t security;
char WICED_SPI_MESSAGE_STR[50];
char WICED_I2C_MESSAGE_STR[50];
char n1[15] = "{\"br\":";
char n2[];// = "90";//NULL;
char n3[3] = "}";
int a = 70;
char sub[65];
uint32_t sublen = NULL;
uint8_t st = 0;
int i =0;

/*I2C Configuration*/
static wiced_i2c_device_t i2c_dev =
{
		.port = WICED_I2C_1,
		.address = 0x50,
		.address_width = I2C_ADDRESS_WIDTH_7BIT,
		.flags = I2C_DEVICE_NO_DMA,
		.speed_mode = I2C_STANDARD_SPEED_MODE,
};

static wiced_i2c_message_t i2c_msg;
static uint8_t tx_temp_data[2];
static uint8_t rx_temp_data[4];
long humi = 0;
long temp = 0;
/******************************************************
 *               Function Definitions
 ******************************************************/



void application_start()
{
	uint8_t txb[3];
	uint8_t rxb[3];
	uint16_t br = 0;

	wiced_spi_device_t mcp3008_spi;
	wiced_spi_message_segment_t mcp3008_msg;

	/*MQTT*/
	static wiced_mqtt_object_t mqtt_object;
	wiced_result_t ret = WICED_SUCCESS;
    uint32_t size_out;

	wiced_init();
    /* Read root CA certificate (self certified) from resources*/
    resource_get_readonly_buffer( &resources_apps_DIR_secure_mqtt_DIR_AA_cer, 0, MQTT_MAX_RESOURCE_SIZE, &size_out, (const void **) &security.ca_cert );
    security.ca_cert_len = size_out;
    security.cert = NULL;
    security.cert_len = NULL;
    security.key = NULL;
    security.key_len = NULL;

    /* Memory allocated for mqtt object*/
    mqtt_object = (wiced_mqtt_object_t) malloc( WICED_MQTT_OBJECT_MEMORY_SIZE_REQUIREMENT );
    if ( mqtt_object == NULL )
    {
        WPRINT_APP_ERROR(("Dont have memory to allocate for mqtt object...\n"));
        return;
    }

    //
	txb[0] = (0x06 | ((0 & 0x07) >> 2));
	txb[1] = ((0 & 0x07) << 6);
	txb[2] = 0x0;

//	wiced_init();
	wiced_network_up(WICED_STA_INTERFACE, WICED_USE_EXTERNAL_DHCP_SERVER, NULL);

	/*MQTT*/
    WPRINT_APP_INFO( ( "Resolving IP address of MQTT broker...\n" ) );
    ret = wiced_hostname_lookup( MQTT_BROKER_ADDRESS, &broker_address, 10000 );
    WPRINT_APP_INFO(("Resolved Broker IP: %u.%u.%u.%u\n\n", (uint8_t)(GET_IPV4_ADDRESS(broker_address) >> 24),
                    (uint8_t)(GET_IPV4_ADDRESS(broker_address) >> 16),
                    (uint8_t)(GET_IPV4_ADDRESS(broker_address) >> 8),
                    (uint8_t)(GET_IPV4_ADDRESS(broker_address) >> 0)));
    if ( ret == WICED_ERROR || broker_address.ip.v4 == 0 )
    {
        WPRINT_APP_INFO(("Error in resolving DNS\n"));
        return;
    }

    //
    wiced_mqtt_init( mqtt_object );
    wiced_i2c_init( &i2c_dev );
    wiced_rtos_init_semaphore( &semaphore );

    mcp3008_spi.port = WICED_SPI_1;
	mcp3008_spi.chip_select = WICED_GPIO_22;
	mcp3008_spi.speed = 1000000;
	mcp3008_spi.mode = (SPI_CLOCK_RISING_EDGE | SPI_CLOCK_IDLE_HIGH | SPI_NO_DMA | SPI_MSB_FIRST);
	mcp3008_spi.bits = 8;

	wiced_spi_init(&mcp3008_spi);

	/*GPIO PIN SET*/
	wiced_gpio_init(WICED_GPIO_1, OUTPUT_PUSH_PULL);
	wiced_gpio_init(WICED_GPIO_8, OUTPUT_PUSH_PULL);
	wiced_gpio_init(WICED_GPIO_10, OUTPUT_PUSH_PULL);
	wiced_gpio_init(WICED_GPIO_12, OUTPUT_PUSH_PULL);

	wiced_gpio_output_high( WICED_GPIO_10 );
	for(i=0; i<1; i++)
	{
		WPRINT_APP_INFO(("[MQTT] Opening connection..."));
		RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_conn_open( mqtt_object,&broker_address, WICED_STA_INTERFACE, callbacks, &security ), NULL, "Did you configure you broker IP address?\n" );

		WPRINT_APP_INFO(("[MQTT] Subscribing..."));
		RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_app_subscribe( mqtt_object, WICED_TOPICSub , WICED_MQTT_QOS_DELIVER_AT_MOST_ONCE ), NULL, NULL );

	//    WPRINT_APP_INFO(("[MQTT] Subscribing..."));
	//    RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_app_subscribe( mqtt_object, WICED_TOPICSub , WICED_MQTT_QOS_DELIVER_AT_MOST_ONCE ), NULL, NULL );
	}
	while(1)
	{
		/* SPI 조도 */
		*WICED_SPI_MESSAGE_STR = NULL;
		memset(&mcp3008_msg, 0, sizeof(mcp3008_msg));
		mcp3008_msg.tx_buffer = txb;
		mcp3008_msg.rx_buffer = rxb;
		mcp3008_msg.length = sizeof(txb);

		wiced_spi_transfer(&mcp3008_spi, &mcp3008_msg, 1);

		br = (((rxb[1] & 0x03) << 8) | rxb[2]);
	//	printf("Brightness : %d, %f(V)\n", br, (3.3/1024)*br);

		a = br;
	    itoa(a, n2, 10);
	    strcat(WICED_SPI_MESSAGE_STR, n1);
	    strcat(WICED_SPI_MESSAGE_STR, n2);
	    strcat(WICED_SPI_MESSAGE_STR, n3);

	    /* I2C 온습도 */
	    *WICED_I2C_MESSAGE_STR = NULL;
	    memset(&i2c_msg, 0, sizeof(i2c_msg));
	    i2c_msg.tx_buffer = tx_temp_data;
	    i2c_msg.rx_buffer = rx_temp_data;
	    i2c_msg.tx_length = sizeof(tx_temp_data);

	    wiced_i2c_transfer(&i2c_dev, &i2c_msg, 1);

//	    if(i2c_msg.flags != 0)
	//    {
//	    printf("%d", i2c_msg.rx_buffer);
	    	humi = rx_temp_data[0] & 0x3F;
	    	humi <<= 8;
	    	humi += rx_temp_data[1];
	    	humi = humi * 100 / 16384;

	    	temp = rx_temp_data[2];
	    	temp *= 64;
	    	temp += (rx_temp_data[3] >> 2) /4;
	    	temp *= 165;
	    	temp /= 16384;
	    	temp -= 40;
//	    	i2cflag=0;
	  //  }

//	    printf("Humi : %f   Temp : %f\n", humi, temp);
//        WPRINT_APP_INFO(("[MQTT] Opening connection..."));
//        RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_conn_open( mqtt_object,&broker_address, WICED_STA_INTERFACE, callbacks, &security ), NULL, "Did you configure you broker IP address?\n" );

//        WPRINT_APP_INFO(("[MQTT] Subscribing..."));
//        RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_app_subscribe( mqtt_object, WICED_TOPICSub , WICED_MQTT_QOS_DELIVER_AT_MOST_ONCE ), NULL, NULL );

 /*       WPRINT_APP_INFO(("[MQTT] Publishing..."));
        RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_app_publish( mqtt_object, WICED_MQTT_QOS_DELIVER_AT_MOST_ONCE, (uint8_t*)WICED_TOPIC, (uint8_t*)WICED_MESSAGE_STR ,sizeof(WICED_MESSAGE_STR) ), NULL, NULL );
*/
//        WPRINT_APP_INFO(("[MQTT] Waiting some time for ping exchange...\n\n"));
//        wiced_rtos_delay_milliseconds( WICED_MQTT_DELAY_IN_MILLISECONDS * 10 );

//        WPRINT_APP_INFO(("[MQTT] Subscribing..."));
//        RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_app_subscribe( mqtt_object, WICED_TOPICSub , WICED_MQTT_QOS_DELIVER_AT_MOST_ONCE ), NULL, NULL );

//        WPRINT_APP_INFO(("[MQTT] Closing connection..."));
//        RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_conn_close( mqtt_object ), NULL, NULL );

        wiced_rtos_delay_milliseconds( WICED_MQTT_DELAY_IN_MILLISECONDS / 2);

        if(st == 1)
        {
        	wiced_rtos_delay_milliseconds( WICED_MQTT_DELAY_IN_MILLISECONDS);
 //       	while(sub[47]==NULL);
        	printf("%s", sub);
        	if(strcmp(sub, aseton) == 0)
        	{
        		WPRINT_APP_INFO(( "A SETON!!!!!! :  \n\n"));
        		wiced_gpio_output_high(WICED_GPIO_1);
        	}
        	else if(strcmp(sub, asetoff) == 0)
        	{
        		WPRINT_APP_INFO(( "A SETOFF!!!!!! :  \n\n"));
        		wiced_gpio_output_low(WICED_GPIO_1);
        	}
        	else if(strcmp(sub, bseton) == 0)
        	{
        		WPRINT_APP_INFO(( "B SETON!!!!!! :  \n\n"));
        		wiced_gpio_output_high(WICED_GPIO_8);
        	}
        	else if(strcmp(sub, bsetoff) == 0)
        	{
        		WPRINT_APP_INFO(( "B SETOFF!!!!!! :  \n\n"));
        		wiced_gpio_output_low(WICED_GPIO_8);
        	}
        	else if(strcmp(sub, cseton) == 0)
        	{
        		WPRINT_APP_INFO(( "C SETON!!!!!! :  \n\n"));
        		wiced_gpio_output_high(WICED_GPIO_12);
        	}
        	else if(strcmp(sub, csetoff) == 0)
        	{
        		WPRINT_APP_INFO(( "C SETOFF!!!!!! :  \n\n"));
        		wiced_gpio_output_low(WICED_GPIO_12);
        	}
        	st = 0;
            WPRINT_APP_INFO(("[MQTT] Subscribing..."));
            RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_app_subscribe( mqtt_object, WICED_TOPICSub , WICED_MQTT_QOS_DELIVER_AT_MOST_ONCE ), NULL, NULL );

        }

//		wiced_rtos_delay_milliseconds( WICED_MQTT_DELAY_IN_MILLISECONDS );


	}
	for(i=0; i<1; i++)
	{
    WPRINT_APP_INFO(("[MQTT] Closing connection..."));
    RUN_COMMAND_PRINT_STATUS_AND_BREAK_ON_ERROR( mqtt_conn_close( mqtt_object ), NULL, NULL );
	}

	wiced_spi_deinit(&mcp3008_spi);

	wiced_gpio_deinit(WICED_GPIO_1);
	wiced_gpio_deinit(WICED_GPIO_8);
	wiced_gpio_deinit(WICED_GPIO_10);
	wiced_gpio_deinit(WICED_GPIO_12);

    wiced_rtos_deinit_semaphore( &semaphore );
    WPRINT_APP_INFO(("[MQTT] Deinit connection..."));
    ret = wiced_mqtt_deinit( mqtt_object );
    mqtt_print_status( ret, NULL, NULL );
    free( mqtt_object );
    mqtt_object = NULL;
    /* Free security resources, only needed at initialization */
    resource_free_readonly_buffer( &resources_apps_DIR_secure_mqtt_DIR_AA_cer, security.ca_cert );

}


/******************************************************
 *               Static Function Definitions
 ******************************************************/

/*
 * A simple result log function
 */
static void mqtt_print_status( wiced_result_t result, const char * ok_message, const char * error_message )
{
    if ( result == WICED_SUCCESS )
    {
        if ( ok_message != NULL )
        {
            WPRINT_APP_INFO(( "OK (%s)\n\n", (ok_message)));
        }
        else
        {
            WPRINT_APP_INFO(( "OK.\n\n" ));
        }
    }
    else
    {
        if ( error_message != NULL )
        {
            WPRINT_APP_INFO(( "ERROR (%s)\n\n", (error_message)));
        }
        else
        {
            WPRINT_APP_INFO(( "ERROR.\n\n" ));
        }
    }
}

/*
 * Call back function to handle connection events.
 */
static wiced_result_t mqtt_connection_event_cb( wiced_mqtt_object_t mqtt_object, wiced_mqtt_event_info_t *event )
{
    switch ( event->type )
    {

        case WICED_MQTT_EVENT_TYPE_CONNECT_REQ_STATUS:
        case WICED_MQTT_EVENT_TYPE_DISCONNECTED:
        case WICED_MQTT_EVENT_TYPE_PUBLISHED:
        case WICED_MQTT_EVENT_TYPE_SUBCRIBED:
        case WICED_MQTT_EVENT_TYPE_UNSUBSCRIBED:
        {
            if (event->type == WICED_MQTT_EVENT_TYPE_PUBLISHED)
            {
                WPRINT_APP_INFO(( "MESSAGE [ID: %u] published\n\n",event->data.msgid) );
            }
            expected_event = event->type;
            wiced_rtos_set_semaphore( &semaphore );
        }
            break;
        case WICED_MQTT_EVENT_TYPE_PUBLISH_MSG_RECEIVED:
        {
            wiced_mqtt_topic_msg_t msg = event->data.pub_recvd;
            WPRINT_APP_INFO(( "[MQTT] Received %.*s  for TOPIC : %.*s\n\n", (int) msg.data_len, msg.data, (int) msg.topic_len, msg.topic ));
            sprintf(sub, "%.*s", msg.data_len, msg.data);
            st = 1;
        }
            break;
        default:
            break;
    }
    return WICED_SUCCESS;
}

/*
 * Call back function to handle channel events.
 *
 * For each event:
 *  - The call back will set the expected_event global to the received event.
 *  - The call back will set the event semaphore to run any blocking thread functions waiting on this event
 *  - Some events will also log other global variables required for extra processing.
 *
 * A thread function will probably be waiting for the received event. Once the event is received and the
 * semaphore is set, the thread function will check for the received event and make sure it matches what
 * it is expecting.
 *
 * Note:  This mechanism is not thread safe as we are using a non protected global variable for read/write.
 * However as this snip is a single controlled thread, there is no risc of racing conditions. It is
 * however not recommended for multi-threaded applications.
 */

/*
 * A blocking call to an expected event.
 */
static wiced_result_t mqtt_wait_for( wiced_mqtt_event_type_t event, uint32_t timeout )
{
    if ( wiced_rtos_get_semaphore( &semaphore, timeout ) != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    else
    {
        if ( event != expected_event )
        {
            return WICED_ERROR;
        }
    }
    return WICED_SUCCESS;
}

/*
 * Open a connection and wait for WICED_MQTT_TIMEOUT period to receive a connection open OK event
 */
static wiced_result_t mqtt_conn_open( wiced_mqtt_object_t mqtt_obj, wiced_ip_address_t *address, wiced_interface_t interface, wiced_mqtt_callback_t callback, wiced_mqtt_security_t *security )
{
    wiced_mqtt_pkt_connect_t conninfo;
    wiced_result_t ret = WICED_SUCCESS;
    uint32_t size_out;

    memset( &conninfo, 0, sizeof( conninfo ) );

    conninfo.port_number = 8883;                   /* set to 0 indicates library to use default settings */
    conninfo.mqtt_version = WICED_MQTT_PROTOCOL_VER4;
    conninfo.clean_session = 1;
    conninfo.client_id = (uint8_t*) CLIENT_ID;
    conninfo.keep_alive = 10;
    conninfo.password = "4d5fb3a4f47543679cfc43e3353bc253";//"31e2bad750d1430b8d79f31e8b5074ac";//"7f8baea6622c4c6488272e513342f06a";//NULL;
    conninfo.username = "afe424f3aafd4f6693fe486eb1c77902";//"e56c80ae277f48f893a6f50f79db20b0";//"b655d2c4c4a54a23b343704b041a6a09";//NULL;
    conninfo.peer_cn = NULL;

    ret = wiced_mqtt_connect( mqtt_obj, address, interface, callback, security, &conninfo );
    if ( ret != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    if ( mqtt_wait_for( WICED_MQTT_EVENT_TYPE_CONNECT_REQ_STATUS, WICED_MQTT_TIMEOUT ) != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    return WICED_SUCCESS;
}

/*
 * Close a connection and wait for 5 seconds to receive a connection close OK event
 */
static wiced_result_t mqtt_conn_close( wiced_mqtt_object_t mqtt_obj )
{
    if ( wiced_mqtt_disconnect( mqtt_obj ) != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    if ( mqtt_wait_for( WICED_MQTT_EVENT_TYPE_DISCONNECTED, WICED_MQTT_TIMEOUT ) != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    return WICED_SUCCESS;
}

/*
 * Subscribe to WICED_TOPIC and wait for 5 seconds to receive an ACM.
 */
static wiced_result_t mqtt_app_subscribe( wiced_mqtt_object_t mqtt_obj, char *topic, uint8_t qos )
{
    wiced_mqtt_msgid_t pktid;
    pktid = wiced_mqtt_subscribe( mqtt_obj, topic, qos );
    if ( pktid == 0 )
    {
        return WICED_ERROR;
    }
    if ( mqtt_wait_for( WICED_MQTT_EVENT_TYPE_SUBCRIBED, WICED_MQTT_TIMEOUT ) != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    return WICED_SUCCESS;
}

/*
 * Unsubscribe from WICED_TOPIC and wait for 10 seconds to receive an ACM.
 */
static wiced_result_t mqtt_app_unsubscribe( wiced_mqtt_object_t mqtt_obj, char *topic )
{
    wiced_mqtt_msgid_t pktid;
    pktid = wiced_mqtt_unsubscribe( mqtt_obj, topic );

    if ( pktid == 0 )
    {
        return WICED_ERROR;
    }
    if ( mqtt_wait_for( WICED_MQTT_EVENT_TYPE_UNSUBSCRIBED, WICED_MQTT_TIMEOUT*2 ) != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    return WICED_SUCCESS;
}

/*
 * Publish (send) WICED_MESSAGE_STR to WICED_TOPIC and wait for 5 seconds to receive a PUBCOMP (as it is QoS=2).
 */
static wiced_result_t mqtt_app_publish( wiced_mqtt_object_t mqtt_obj, uint8_t qos, uint8_t *topic, uint8_t *data, uint32_t data_len )
{
    wiced_mqtt_msgid_t pktid;
    pktid = wiced_mqtt_publish( mqtt_obj, topic, data, data_len, qos );

    if ( pktid == 0 )
    {
        return WICED_ERROR;
    }

    if ( mqtt_wait_for( WICED_MQTT_EVENT_TYPE_PUBLISHED, WICED_MQTT_TIMEOUT ) != WICED_SUCCESS )
    {
        return WICED_ERROR;
    }
    wiced_rtos_delay_milliseconds( WICED_MQTT_DELAY_IN_MILLISECONDS2  );
    return WICED_SUCCESS;
}
