NAME := App_Artikrel2

$(NAME)_SOURCES := artikrel2.c

$(NAME)_COMPONENTS := protocols/MQTT \
                      utilities/command_console/wifi \
                      utilities/command_console
                      
$(NAME)_RESOURCES  := apps/secure_mqtt/AA.cer