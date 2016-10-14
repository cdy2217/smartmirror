#ifndef _MAIN_HEADER_ 
#define _MAIN_HEADER_ 

#include <opencv2/imgproc/imgproc.hpp>
#include<opencv2/opencv.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <string>
#include <unistd.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <arpa/inet.h>
#include <stdlib.h>
#include <netdb.h>

#define ORIGCOL2COL CV_BGR2HLS
#define COL2ORIGCOL CV_HLS2BGR
#define NSAMPLES 1
#define PI 3.14159


int htmlget(int num);
int create_tcp_socket();
char *get_ip(char *host);
char *build_get_query(char *host, char *page, int num);
void usage();
 
#define HOST "localhost"//"hongst.iptime.org"
#define PAGE "/"
#define PORT 9090
#define USERAGENT "HTMLGET 1.0"


#endif
